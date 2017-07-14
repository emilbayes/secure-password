var sodium = require('sodium-universal')
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

SecurePassword.INVALID_UNRECOGNIZED_HASH = -1
SecurePassword.INVALID = 0
SecurePassword.VALID = 1
SecurePassword.VALID_NEEDS_REHASH = 2

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

  var parameters = decodeArgon2iStr(hashBuf)
  if (parameters === false) return SecurePassword.INVALID_UNRECOGNIZED_HASH

  if (sodium.crypto_pwhash_str_verify(hashBuf, passwordBuf) === false) {
    return SecurePassword.INVALID
  }

  if (parameters.memlimit < this.memlimit || parameters.opslimit < this.opslimit) {
    return SecurePassword.VALID_NEEDS_REHASH
  }

  return SecurePassword.VALID
}

SecurePassword.prototype.verify = function (passwordBuf, hashBuf, cb) {
  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')
  assert(typeof cb === 'function', 'cb must be function')

  assert(Buffer.isBuffer(hashBuf), 'hashBuf must be Buffer')
  assert(hashBuf.length === SecurePassword.HASH_BYTES, 'hashBuf must be HASH_BYTES (' + SecurePassword.HASH_BYTES + ')')

  var parameters = decodeArgon2iStr(hashBuf)
  if (parameters === false) return process.nextTick(cb, null, SecurePassword.INVALID_UNRECOGNIZED_HASH)

  sodium.crypto_pwhash_str_verify_async(hashBuf, passwordBuf, function (err, bool) {
    if (err) return cb(err)

    if (bool === false) return cb(null, SecurePassword.INVALID)

    if (parameters.memlimit < this.memlimit || parameters.opslimit < this.opslimit) {
      return cb(null, SecurePassword.VALID_NEEDS_REHASH)
    }

    return cb(null, SecurePassword.VALID)
  }.bind(this))
}

var Argon2iStr_ALG_TAG = Buffer.from('$argon2i')
var Argon2iStr_VERSION_KEY = Buffer.from('$v=')
var Argon2iStr_MEMORY_KEY = Buffer.from('$m=')
var Argon2iStr_TIME_KEY = Buffer.from(',t=')

function decodeArgon2iStr (hash) {
  assert(Buffer.isBuffer(hash), 'Hash must be Buffer')
  var idx = 0

  var type = ''
  var version = -1
  var memory = -1
  var time = -1
  // var lanes = -1
  // var threads = lanes
  // var salt = Buffer.allocUnsafe(sodium.crypto_pwhash_SALTBYTES)
  // var out = Buffer.allocUnsafe(32) // STR_HASHBYTES

  var isArgon2i = Buffer.compare(Argon2iStr_ALG_TAG, hash.slice(idx, idx += 8)) === 0
  if (isArgon2i === false) return false
  type = 'argon2i'

  assert(Buffer.compare(Argon2iStr_VERSION_KEY, hash.slice(idx, idx += 3)) === 0, 'Hash is missing version')
  version = parseInt(hash.slice(idx, idx = hash.indexOf('$', idx)), 10)
  assert(Number.isSafeInteger(version) && version > 0, 'Hash has invalid version')

  assert(Buffer.compare(Argon2iStr_MEMORY_KEY, hash.slice(idx, idx += 3)) === 0, 'Hash is missing memory cost')
  memory = parseInt(hash.slice(idx, idx = hash.indexOf(',', idx)), 10)
  assert(Number.isSafeInteger(memory) && memory > 0, 'Hash has invalid memory cost')

  assert(Buffer.compare(Argon2iStr_TIME_KEY, hash.slice(idx, idx += 3)) === 0, 'Hash is missing time cost')
  time = parseInt(hash.slice(idx, idx = hash.indexOf(',', idx)), 10)
  assert(Number.isSafeInteger(time) && time > 0, 'Hash has invalid time cost')

  // assert(Buffer.from(',p=').compare(hash, idx, idx += 3) === 0, 'Hash is missing lanes')
  // lanes = parseInt(hash.slice(idx, idx = hash.indexOf('$', idx)), 10)
  // threads = lanes
  // idx++
  // assert(hash.indexOf('$', idx + 1) - idx === Math.ceil(salt.length * 8 / 6), 'Hash is containing salt of incorrect length')
  // // Needs to figure out how to read base64 block by block
  // salt.write(hash.slice(idx, idx = hash.indexOf('$', idx)), 0, 'base64')

  return {
    memlimit: memory << 10,
    opslimit: time,
    algo: type,
    version: version
  }
}
