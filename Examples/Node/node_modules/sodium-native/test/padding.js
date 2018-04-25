var alloc = require('buffer-alloc')
var test = require('tape')
var sodium = require('../')

test('sodium_pad / sodium_unpad', function (assert) {
  for (var i = 0; i < 2000; i++) {
    var binLen = sodium.randombytes_uniform(200)
    var blocksize = 1 + sodium.randombytes_uniform(100)
    var binPaddedMaxlen = binLen + (blocksize - (binLen % blocksize))
    var bingPaddedLong = alloc(binPaddedMaxlen + 1)
    var binPaddedLen = bingPaddedLong.slice(0, binPaddedMaxlen)
    sodium.randombytes_buf(binPaddedLen)

    var smallThrow = didThrow(function () {
      sodium.sodium_pad(binPaddedLen.slice(0, binPaddedMaxlen - 1), binLen, blocksize)
    })
    if (smallThrow === false) assert.fail('did not throw')

    var zeroThrow = didThrow(function () {
      sodium.sodium_pad(binPaddedLen, binLen, 0)
    })
    if (zeroThrow === false) assert.fail('did not throw')

    sodium.sodium_pad(bingPaddedLong, binLen, blocksize)
    var binUnpaddedLen = sodium.sodium_pad(binPaddedLen, binLen, blocksize)
    if (binUnpaddedLen !== binPaddedMaxlen) assert.fail('binUnpaddedLen was not same')

    var largeThrow = didThrow(function () {
      sodium.sodium_unpad(binPaddedLen, binUnpaddedLen, binPaddedMaxlen + 1)
    })
    if (largeThrow === false) assert.fail('did not throw')

    var emptyThrow = didThrow(function () {
      sodium.sodium_unpad(binPaddedLen, binUnpaddedLen, 0)
    })
    if (emptyThrow === false) assert.fail('did not throw')

    var len2 = sodium.sodium_unpad(binPaddedLen, binUnpaddedLen, blocksize)
    if (len2 !== binLen) assert.fail('len2 was not same')
  }

  assert.pass()
  assert.end()
})

function didThrow (fn) {
  try {
    fn()
    return false
  } catch (ex) {
    return true
  }
}
