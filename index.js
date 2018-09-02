var sodium = require('sodium-native')
var assert = require('nanoassert')

module.exports = SecurePassword
SecurePassword.HASH_BYTES = sodium.crypto_pwhash_STRBYTES

SecurePassword.PASSWORD_BYTES_MIN = sodium.crypto_pwhash_PASSWD_MIN
SecurePassword.PASSWORD_BYTES_MAX = sodium.crypto_pwhash_PASSWD_MAX

SecurePassword.MEMLIMIT_MIN = sodium.crypto_pwhash_MEMLIMIT_MIN
SecurePassword.MEMLIMIT_MAX = sodium.crypto_pwhash_MEMLIMIT_MAX
SecurePassword.OPSLIMIT_MIN = sodium.crypto_pwhash_OPSLIMIT_MIN
SecurePassword.OPSLIMIT_MAX = sodium.crypto_pwhash_OPSLIMIT_MAX

SecurePassword.MEMLIMIT_DEFAULT = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
SecurePassword.OPSLIMIT_DEFAULT = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE

SecurePassword.INVALID_UNRECOGNIZED_HASH = Symbol('INVALID_UNRECOGNIZED_HASH')
SecurePassword.INVALID = Symbol('INVALID')
SecurePassword.VALID = Symbol('VALID')
SecurePassword.VALID_NEEDS_REHASH = Symbol('VALID_NEEDS_REHASH')

function SecurePassword (opts) {
  if (!(this instanceof SecurePassword)) return new SecurePassword(opts)
  opts = opts || {}

  if (opts.memlimit == null) this.memlimit = SecurePassword.MEMLIMIT_DEFAULT
  else this.memlimit = opts.memlimit

  assert(this.memlimit >= SecurePassword.MEMLIMIT_MIN, 'opts.memlimit must be at least MEMLIMIT_MIN (' + SecurePassword.MEMLIMIT_MIN + ')')
  assert(this.memlimit <= SecurePassword.MEMLIMIT_MAX, 'opts.memlimit must be at most MEMLIMIT_MAX (' + SecurePassword.MEMLIMIT_MAX + ')')

  if (opts.opslimit == null) this.opslimit = SecurePassword.OPSLIMIT_DEFAULT
  else this.opslimit = opts.opslimit

  assert(this.opslimit >= SecurePassword.OPSLIMIT_MIN, 'opts.opslimit must be at least OPSLIMIT_MIN (' + SecurePassword.OPSLIMIT_MIN + ')')
  assert(this.opslimit <= SecurePassword.OPSLIMIT_MAX, 'opts.memlimit must be at most OPSLIMIT_MAX (' + SecurePassword.OPSLIMIT_MAX + ')')
}

SecurePassword.prototype.hashSync = function (passwordBuf) {
  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')

  // Unsafe is okay here since sodium will overwrite all bytes
  var hashBuf = Buffer.allocUnsafe(SecurePassword.HASH_BYTES)
  sodium.crypto_pwhash_str(hashBuf, passwordBuf, this.opslimit, this.memlimit)

  // Note that this buffer may have trailing NULL bytes, which is by design
  // (of libsodium). The trailing NULL bytes can be safely trimmed if need
  // be per libsodium docs. This is a TODO as we currently don't handle this case
  return hashBuf
}

SecurePassword.prototype.hash = function (passwordBuf, cb) {
  // support promises
  if (cb === undefined) {
    return new Promise((resolve, reject) => {
      this.hash(passwordBuf, function (err, hashBuf) {
        if (err) {
          reject(err)
          return
        }

        resolve(hashBuf)
      })
    })
  }

  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')
  assert(typeof cb === 'function', 'cb must be function')

  // Unsafe is okay here since sodium will overwrite all bytes
  var hashBuf = Buffer.allocUnsafe(SecurePassword.HASH_BYTES)
  sodium.crypto_pwhash_str_async(hashBuf, passwordBuf, this.opslimit, this.memlimit, function (err) {
    if (err) return cb(err)

    return cb(null, hashBuf)
  })
}

SecurePassword.prototype.verifySync = function (passwordBuf, hashBuf) {
  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')

  assert(Buffer.isBuffer(hashBuf), 'hashBuf must be Buffer')
  assert(hashBuf.length === SecurePassword.HASH_BYTES, 'hashBuf must be HASH_BYTES (' + SecurePassword.HASH_BYTES + ')')

  if (recognizedAlgorithm(hashBuf) === false) return SecurePassword.INVALID_UNRECOGNIZED_HASH

  if (sodium.crypto_pwhash_str_verify(hashBuf, passwordBuf) === false) {
    return SecurePassword.INVALID
  }

  if (sodium.crypto_pwhash_str_needs_rehash(hashBuf, this.opslimit, this.memlimit)) {
    return SecurePassword.VALID_NEEDS_REHASH
  }

  return SecurePassword.VALID
}

SecurePassword.prototype.verify = function (passwordBuf, hashBuf, cb) {
  // support promises
  if (cb === undefined) {
    return new Promise((resolve, reject) => {
      this.verify(passwordBuf, hashBuf, function (err, bool) {
        if (err) {
          reject(err)
          return
        }

        resolve(bool)
      })
    })
  }

  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')
  assert(typeof cb === 'function', 'cb must be function')

  assert(Buffer.isBuffer(hashBuf), 'hashBuf must be Buffer')
  assert(hashBuf.length === SecurePassword.HASH_BYTES, 'hashBuf must be HASH_BYTES (' + SecurePassword.HASH_BYTES + ')')

  if (recognizedAlgorithm(hashBuf) === false) return process.nextTick(cb, null, SecurePassword.INVALID_UNRECOGNIZED_HASH)

  sodium.crypto_pwhash_str_verify_async(hashBuf, passwordBuf, function (err, bool) {
    if (err) return cb(err)

    if (bool === false) return cb(null, SecurePassword.INVALID)

    if (sodium.crypto_pwhash_str_needs_rehash(hashBuf, this.opslimit, this.memlimit)) {
      return cb(null, SecurePassword.VALID_NEEDS_REHASH)
    }

    return cb(null, SecurePassword.VALID)
  }.bind(this))
}

function recognizedAlgorithm (hashBuf) {
  return hashBuf.indexOf('$argon2i$') > -1 || hashBuf.indexOf('$argon2id$') > -1
}
