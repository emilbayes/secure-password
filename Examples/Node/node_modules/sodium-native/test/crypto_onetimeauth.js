var tape = require('tape')
var alloc = require('buffer-alloc')
var fill = require('buffer-fill')
var sodium = require('../')

tape('crypto_onetimeauth', function (t) {
  var key = alloc(sodium.crypto_onetimeauth_KEYBYTES)
  var mac = alloc(sodium.crypto_onetimeauth_BYTES)
  var value = new Buffer('Hello, World!')

  sodium.randombytes_buf(key)
  sodium.crypto_onetimeauth(mac, value, key)

  t.notEqual(mac, alloc(mac.length), 'not blank')
  t.notOk(sodium.crypto_onetimeauth_verify(alloc(mac.length), value, key), 'does not verify')
  t.ok(sodium.crypto_onetimeauth_verify(mac, value, key), 'verifies')

  t.end()
})

tape('crypto_onetimeauth_instance', function (t) {
  var key = alloc(sodium.crypto_onetimeauth_KEYBYTES)
  fill(key, 'lo')

  t.throws(function () {
    sodium.crypto_onetimeauth_instance()
  }, 'key required')

  key[0] = 42

  var instance = sodium.crypto_onetimeauth_instance(key)
  var value = new Buffer('Hello, World!')

  for (var i = 0; i < 10; i++) instance.update(value)

  var mac = alloc(sodium.crypto_onetimeauth_BYTES)
  instance.final(mac)

  t.same(mac.toString('hex'), 'ac35df70e6b95051e015de11a6cbf4ab', 'streaming mac')

  t.end()
})
