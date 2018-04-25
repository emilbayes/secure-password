var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')
var fill = require('buffer-fill')

tape('crypto_kx_seed_keypair', function (t) {
  var pk = alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_kx_SECRETKEYBYTES)
  var seed = alloc(sodium.crypto_kx_SEEDBYTES)

  fill(seed, 'lo')

  t.throws(function () {
    sodium.crypto_kx_seed_keypair()
  }, 'should validate input')

  t.throws(function () {
    sodium.crypto_kx_seed_keypair(new Buffer(0), new Buffer(0), new Buffer(0))
  }, 'should validate input length')

  sodium.crypto_kx_seed_keypair(pk, sk, seed)

  var eSk = '768475983073421d5b1676c4aabb24fdf17c3a5f19e6e9e9cdefbfeb45ceb153'
  var ePk = '0cd703bbd6b1d46dc431a1fc4f1f7724c64b1d4c471e8c17de4966c9e15bf85e'

  t.same(pk.toString('hex'), ePk, 'seeded public key')
  t.same(sk.toString('hex'), eSk, 'seeded secret key')
  t.end()
})

tape('crypto_kx_keypair', function (t) {
  var pk = alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  var sk = alloc(sodium.crypto_kx_SECRETKEYBYTES)

  sodium.crypto_kx_keypair(pk, sk)

  t.notEqual(pk, alloc(pk.length), 'made public key')
  t.notEqual(sk, alloc(sk.length), 'made secret key')

  t.throws(function () {
    sodium.crypto_kx_keypair()
  }, 'should validate input')

  t.throws(function () {
    sodium.crypto_kx_keypair(new Buffer(0), new Buffer(0))
  }, 'should validate input length')

  t.end()
})

tape('crypto_kx_client_session_keys', function (t) {
  var clientPk = alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  var clientSk = alloc(sodium.crypto_kx_SECRETKEYBYTES)
  var serverPk = alloc(sodium.crypto_kx_PUBLICKEYBYTES)
  var serverSk = alloc(sodium.crypto_kx_SECRETKEYBYTES)

  var serverRx = alloc(sodium.crypto_kx_SESSIONKEYBYTES)
  var serverTx = alloc(sodium.crypto_kx_SESSIONKEYBYTES)

  var clientRx = alloc(sodium.crypto_kx_SESSIONKEYBYTES)
  var clientTx = alloc(sodium.crypto_kx_SESSIONKEYBYTES)

  sodium.crypto_kx_keypair(serverPk, serverSk)
  sodium.crypto_kx_keypair(clientPk, clientSk)

  t.throws(function () {
    sodium.crypto_kx_client_session_keys()
  }, 'should validate')

  t.throws(function () {
    sodium.crypto_kx_server_session_keys()
  }, 'should validate')

  sodium.crypto_kx_client_session_keys(clientRx, clientTx, clientPk, clientSk, serverPk)
  sodium.crypto_kx_server_session_keys(serverRx, serverTx, serverPk, serverSk, clientPk)

  t.same(clientRx, serverTx)
  t.same(clientTx, serverRx)
  t.end()
})

tape('crypto_kx constants', function (t) {
  t.same(typeof sodium.crypto_kx_SESSIONKEYBYTES, 'number')
  t.same(typeof sodium.crypto_kx_PUBLICKEYBYTES, 'number')
  t.same(typeof sodium.crypto_kx_SECRETKEYBYTES, 'number')
  t.same(typeof sodium.crypto_kx_SEEDBYTES, 'number')
  t.same(typeof sodium.crypto_kx_PRIMITIVE, 'string')
  t.end()
})
