var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')

tape('crypto_hash_sha256', function (t) {
  var out = alloc(sodium.crypto_hash_sha256_BYTES)
  var inp = new Buffer('Hej, Verden!')

  t.throws(function () {
    sodium.crypto_hash(alloc(0), inp)
  }, 'throws on bad input')

  sodium.crypto_hash_sha256(out, inp)

  var result = 'f0704b1e832b05d01223952fb2512181af4f843ce7bb6b443afd5ea028010e6c'
  t.same(out.toString('hex'), result, 'hashed the string')

  t.end()
})

tape('crypto_hash_sha256_instance', function (t) {
  var out = alloc(sodium.crypto_hash_sha256_BYTES)
  var inp = new Buffer('Hej, Verden!')

  var instance = sodium.crypto_hash_sha256_instance()
  instance.update(inp)
  instance.final(out)

  var result = 'f0704b1e832b05d01223952fb2512181af4f843ce7bb6b443afd5ea028010e6c'
  t.same(out.toString('hex'), result, 'hashed the string')

  t.end()
})
