var tape = require('tape')
var alloc = require('buffer-alloc')
var sodium = require('../')

tape('crypto_auth', function (t) {
  var key = alloc(sodium.crypto_auth_KEYBYTES)
  sodium.randombytes_buf(key)

  var mac = alloc(sodium.crypto_auth_BYTES)
  var value = new Buffer('Hej, Verden')

  sodium.crypto_auth(mac, value, key)

  t.notEqual(mac, alloc(mac.length), 'mac not blank')
  t.notOk(sodium.crypto_auth_verify(alloc(mac.length), value, key), 'does not verify')
  t.ok(sodium.crypto_auth_verify(mac, value, key), 'verifies')

  t.end()
})
