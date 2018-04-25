var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')
var fill = require('buffer-fill')

tape('crypto_sign_seed_keypair', function (t) {
  var pk = alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_sign_SECRETKEYBYTES)
  var seed = alloc(sodium.crypto_sign_SEEDBYTES)

  fill(seed, 'lo')

  t.throws(function () {
    sodium.crypto_sign_seed_keypair()
  }, 'should validate input')

  t.throws(function () {
    sodium.crypto_sign_seed_keypair(new Buffer(0), new Buffer(0), new Buffer(0))
  }, 'should validate input length')

  sodium.crypto_sign_seed_keypair(pk, sk, seed)

  var eSk = '6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f6c6f41eb5b4dba29b19e391d9a4d1a4a879b27958ff3734e10cfbf1f46d68f4d3038'
  var ePk = '41eb5b4dba29b19e391d9a4d1a4a879b27958ff3734e10cfbf1f46d68f4d3038'

  t.same(pk.toString('hex'), ePk, 'seeded public key')
  t.same(sk.toString('hex'), eSk, 'seeded secret key')
  t.end()
})

tape('crypto_sign_keypair', function (t) {
  var pk = alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_keypair(pk, sk)

  t.notEqual(pk, alloc(pk.length), 'made public key')
  t.notEqual(sk, alloc(sk.length), 'made secret key')

  t.throws(function () {
    sodium.crypto_sign_keypair()
  }, 'should validate input')

  t.throws(function () {
    sodium.crypto_sign_keypair(new Buffer(0), new Buffer(0))
  }, 'should validate input length')

  t.end()
})

tape('crypto_sign', function (t) {
  var pk = alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_keypair(pk, sk)

  var message = new Buffer('Hello, World!')
  var signedMessage = alloc(message.length + sodium.crypto_sign_BYTES)

  sodium.crypto_sign(signedMessage, message, sk)

  t.same(signedMessage.slice(-message.length), message, 'contains message')

  var output = alloc(message.length)

  t.notOk(sodium.crypto_sign_open(output, alloc(signedMessage.length), pk), 'was not signed')
  t.ok(sodium.crypto_sign_open(output, signedMessage, pk), 'was signed')

  t.same(output, message, 'same message')
  t.end()
})

tape('crypto_sign_detached', function (t) {
  var pk = alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_keypair(pk, sk)

  var message = new Buffer('Hello, World!')
  var signature = alloc(sodium.crypto_sign_BYTES)

  sodium.crypto_sign_detached(signature, message, sk)

  t.notOk(sodium.crypto_sign_verify_detached(Buffer.concat([alloc(1), signature]), message, pk), 'was not signed')
  t.ok(sodium.crypto_sign_verify_detached(signature, message, pk), 'was signed')

  t.end()
})
