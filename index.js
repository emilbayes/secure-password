var sodium = require('sodium-universal')
var assert = require('assert')

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

SecurePassword.VALID = 0
SecurePassword.INVALID = -1
SecurePassword.VALID_NEEDS_REHASH = -2

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

  return sodium.crypto_pwhash_str_verify(hashBuf, passwordBuf) ? SecurePassword.VALID : SecurePassword.INVALID
}

SecurePassword.prototype.verify = function (passwordBuf, hashBuf, cb) {
  assert(Buffer.isBuffer(passwordBuf), 'passwordBuf must be Buffer')
  assert(passwordBuf.length >= SecurePassword.PASSWORD_BYTES_MIN, 'passwordBuf must be at least PASSWORD_BYTES_MIN (' + SecurePassword.PASSWORD_BYTES_MIN + ')')
  assert(passwordBuf.length < SecurePassword.PASSWORD_BYTES_MAX, 'passwordBuf must be shorter than PASSWORD_BYTES_MAX (' + SecurePassword.PASSWORD_BYTES_MAX + ')')
  assert(typeof cb === 'function', 'cb must be function')

  assert(Buffer.isBuffer(hashBuf), 'hashBuf must be Buffer')
  assert(hashBuf.length === SecurePassword.HASH_BYTES, 'hashBuf must be HASH_BYTES (' + SecurePassword.HASH_BYTES + ')')

  sodium.crypto_pwhash_str_verify_async(hashBuf, passwordBuf, function (err, bool) {
    if (err) return cb(err)

    return cb(null, bool ? SecurePassword.VALID : SecurePassword.INVALID)
  })
}
