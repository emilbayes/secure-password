var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')

tape('crypto_stream', function (t) {
  var buf = alloc(50)
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  sodium.crypto_stream(buf, nonce, key)

  t.notEquals(buf, alloc(50), 'contains noise now')
  var copy = new Buffer(buf.toString('hex'), 'hex')

  sodium.crypto_stream(buf, nonce, key)
  t.same(buf, copy, 'predictable from nonce, key')

  t.end()
})

tape('crypto_stream_xor', function (t) {
  var message = new Buffer('Hello, World!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  sodium.crypto_stream_xor(message, message, nonce, key)

  t.notEquals(message, new Buffer('Hello, World!'), 'encrypted')

  sodium.crypto_stream_xor(message, message, nonce, key)

  t.same(message, new Buffer('Hello, World!'), 'decrypted')

  t.end()
})

tape('crypto_stream_xor_instance', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_xor_instance(nonce, key)

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
  }

  sodium.crypto_stream_xor(out, out, nonce, key)
  t.same(out, message, 'decrypted')
  t.end()
})

tape('crypto_stream_xor_instance with empty buffers', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_xor_instance(nonce, key)

  inst.update(new Buffer(0), new Buffer(0))

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
    inst.update(new Buffer(0), new Buffer(0))
  }

  sodium.crypto_stream_xor(out, out, nonce, key)
  t.same(out, message, 'decrypted')
  t.end()
})

tape('crypto_stream_xor_instance long stream', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 1000; i++) {
    var next = random(61)
    plain.push(next)

    var enc = new Buffer(61)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(61)
    decrypt.update(dec, enc)
    decrypted.push(dec)
  }

  var enc2 = new Buffer(1000 * 61)
  sodium.crypto_stream_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_xor_instance long stream (random chunks)', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 10000; i++) {
    var len = Math.floor(Math.random() * 256)
    var next = random(len)
    plain.push(next)

    var enc = new Buffer(len)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(len)
    decrypt.update(dec, enc)
    decrypted.push(dec)
  }

  var enc2 = new Buffer(Buffer.concat(plain).length)
  sodium.crypto_stream_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_xor_instance long stream (random chunks) with empty buffers', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 10000; i++) {
    var len = Math.floor(Math.random() * 256)
    var next = random(len)
    plain.push(next)

    encrypt.update(new Buffer(0), new Buffer(0))

    var enc = new Buffer(len)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(len)
    decrypt.update(dec, enc)
    decrypted.push(dec)
    decrypt.update(new Buffer(0), new Buffer(0))
  }

  var enc2 = new Buffer(Buffer.concat(plain).length)
  sodium.crypto_stream_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_xor_instance after GC', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_xor_instance(nonce, key)

  var nonceCopy = new Buffer(nonce.toString('hex'), 'hex')
  var keyCopy = new Buffer(key.toString('hex'), 'hex')
  nonce = null
  key = null

  forceGC()

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
  }

  sodium.crypto_stream_xor(out, out, nonceCopy, keyCopy)
  t.same(out, message, 'decrypted')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_chacha20_xor_instance(nonce, key)

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
  }

  sodium.crypto_stream_chacha20_xor(out, out, nonce, key)
  t.same(out, message, 'decrypted')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance with empty buffers', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_chacha20_xor_instance(nonce, key)

  inst.update(new Buffer(0), new Buffer(0))

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
    inst.update(new Buffer(0), new Buffer(0))
  }

  sodium.crypto_stream_chacha20_xor(out, out, nonce, key)
  t.same(out, message, 'decrypted')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance long stream', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 1000; i++) {
    var next = random(61)
    plain.push(next)

    var enc = new Buffer(61)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(61)
    decrypt.update(dec, enc)
    decrypted.push(dec)
  }

  var enc2 = new Buffer(1000 * 61)
  sodium.crypto_stream_chacha20_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance long stream (random chunks)', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 10000; i++) {
    var len = Math.floor(Math.random() * 256)
    var next = random(len)
    plain.push(next)

    var enc = new Buffer(len)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(len)
    decrypt.update(dec, enc)
    decrypted.push(dec)
  }

  var enc2 = new Buffer(Buffer.concat(plain).length)
  sodium.crypto_stream_chacha20_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance long stream (random chunks) with empty buffers', function (t) {
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var encrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var decrypt = sodium.crypto_stream_chacha20_xor_instance(nonce, key)
  var plain = []
  var encrypted = []
  var decrypted = []

  for (var i = 0; i < 10000; i++) {
    var len = Math.floor(Math.random() * 256)
    var next = random(len)
    plain.push(next)

    encrypt.update(new Buffer(0), new Buffer(0))

    var enc = new Buffer(len)
    encrypt.update(enc, next)
    encrypted.push(enc)

    var dec = new Buffer(len)
    decrypt.update(dec, enc)
    decrypted.push(dec)
    decrypt.update(new Buffer(0), new Buffer(0))
  }

  var enc2 = new Buffer(Buffer.concat(plain).length)
  sodium.crypto_stream_chacha20_xor(enc2, Buffer.concat(plain), nonce, key)

  t.same(Buffer.concat(encrypted), enc2, 'same as encrypting all at once')
  t.same(Buffer.concat(decrypted), Buffer.concat(plain), 'decrypts')
  t.end()
})

tape('crypto_stream_chacha20_xor_instance after GC', function (t) {
  var message = new Buffer('Hello, world!')
  var nonce = random(sodium.crypto_stream_NONCEBYTES)
  var key = random(sodium.crypto_stream_KEYBYTES)

  var out = new Buffer(message.length)

  var inst = sodium.crypto_stream_chacha20_xor_instance(nonce, key)

  var nonceCopy = new Buffer(nonce.toString('hex'), 'hex')
  var keyCopy = new Buffer(key.toString('hex'), 'hex')
  nonce = null
  key = null

  forceGC()

  for (var i = 0; i < message.length; i++) {
    inst.update(out.slice(i), message.slice(i, i + 1))
  }

  sodium.crypto_stream_chacha20_xor(out, out, nonceCopy, keyCopy)
  t.same(out, message, 'decrypted')
  t.end()
})

function random (n) {
  var buf = alloc(n)
  sodium.randombytes_buf(buf)
  return buf
}

function forceGC () {
  var list = []
  for (var i = 0; i < 1e6; i++) {
    list.push({})
  }
  list = null
}
