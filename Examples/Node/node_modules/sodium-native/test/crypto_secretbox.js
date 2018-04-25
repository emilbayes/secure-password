var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')

tape('crypto_secretbox_easy', function (t) {
  var message = new Buffer('Hej, Verden!')
  var output = alloc(message.length + sodium.crypto_secretbox_MACBYTES)

  var key = alloc(sodium.crypto_secretbox_KEYBYTES)
  sodium.randombytes_buf(key)

  var nonce = alloc(sodium.crypto_secretbox_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  t.throws(function () {
    sodium.crypto_secretbox_easy(alloc(0), message, nonce, key)
  }, 'throws if output is too small')

  t.throws(function () {
    sodium.crypto_secretbox_easy(alloc(message.length), message, nonce, key)
  }, 'throws if output is too small')

  sodium.crypto_secretbox_easy(output, message, nonce, key)
  t.notEqual(output, alloc(output.length))

  var result = alloc(output.length - sodium.crypto_secretbox_MACBYTES)
  t.notOk(sodium.crypto_secretbox_open_easy(result, output, alloc(sodium.crypto_secretbox_NONCEBYTES), key), 'could not decrypt')
  t.ok(sodium.crypto_secretbox_open_easy(result, output, nonce, key), 'could decrypt')

  t.same(result, message, 'decrypted message is correct')

  t.end()
})

tape('crypto_secretbox_easy overwrite buffer', function (t) {
  var output = alloc(Buffer.byteLength('Hej, Verden!') + sodium.crypto_secretbox_MACBYTES)
  output.write('Hej, Verden!', sodium.crypto_secretbox_MACBYTES)

  var key = alloc(sodium.crypto_secretbox_KEYBYTES)
  sodium.randombytes_buf(key)

  var nonce = alloc(sodium.crypto_secretbox_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  sodium.crypto_secretbox_easy(output, output.slice(sodium.crypto_secretbox_MACBYTES), nonce, key)
  t.notEqual(output, alloc(output.length))

  t.ok(sodium.crypto_secretbox_open_easy(output.slice(sodium.crypto_secretbox_MACBYTES), output, nonce, key), 'could decrypt')
  t.same(output.slice(sodium.crypto_secretbox_MACBYTES), new Buffer('Hej, Verden!'), 'decrypted message is correct')

  t.end()
})

tape('crypto_secretbox_detached', function (t) {
  var message = new Buffer('Hej, Verden!')
  var output = alloc(message.length)
  var mac = alloc(sodium.crypto_secretbox_MACBYTES)

  var key = alloc(sodium.crypto_secretbox_KEYBYTES)
  sodium.randombytes_buf(key)

  var nonce = alloc(sodium.crypto_secretbox_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  sodium.crypto_secretbox_detached(output, mac, message, nonce, key)

  t.notEqual(mac, alloc(mac.length), 'mac not blank')
  t.notEqual(output, alloc(output.length), 'output not blank')

  var result = alloc(output.length)

  t.notOk(sodium.crypto_secretbox_open_detached(result, output, mac, nonce, alloc(key.length)), 'could not decrypt')
  t.ok(sodium.crypto_secretbox_open_detached(result, output, mac, nonce, key), 'could decrypt')

  t.same(result, message, 'decrypted message is correct')

  t.end()
})
