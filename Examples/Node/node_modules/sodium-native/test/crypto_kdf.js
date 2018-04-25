var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')

tape('crypto_kdf_keygen', function (t) {
  var key = alloc(sodium.crypto_kdf_KEYBYTES)

  t.throws(function () {
    sodium.crypto_kdf_keygen(alloc(1))
  })

  sodium.crypto_kdf_keygen(key)

  t.notEqual(key, alloc(key.length))
  t.end()
})

tape('crypto_kdf_derive_from_key', function (t) {
  var key = alloc(sodium.crypto_kdf_KEYBYTES)

  sodium.crypto_kdf_keygen(key)

  var subkey = alloc(sodium.crypto_kdf_BYTES_MIN)

  sodium.crypto_kdf_derive_from_key(subkey, 0, new Buffer('context_'), key)
  t.notEqual(subkey, alloc(subkey.length))

  var subkey2 = alloc(sodium.crypto_kdf_BYTES_MIN)

  sodium.crypto_kdf_derive_from_key(subkey2, 1, new Buffer('context_'), key)
  t.notEqual(subkey, subkey2)

  sodium.crypto_kdf_derive_from_key(subkey2, 0, new Buffer('context_'), key)
  t.same(subkey, subkey2)

  t.end()
})
