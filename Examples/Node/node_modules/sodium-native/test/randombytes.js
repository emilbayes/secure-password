var tape = require('tape')
var sodium = require('../')
var alloc = require('buffer-alloc')

tape('constants', function (assert) {
  assert.same(typeof sodium.randombytes_SEEDBYTES, 'number', 'randombytes_SEEDBYTES is number')

  assert.end()
})

tape('randombytes_random', function (t) {
  for (var i = 0; i < 1e6; i++) {
    var n = sodium.randombytes_random()
    if (n > 0xffffffff || n < 0) t.fail()
  }

  t.end()
})

tape('randombytes_uniform', function (t) {
  var p = 5381
  for (var i = 0; i < 1e6; i++) {
    var n = sodium.randombytes_uniform(5381)
    if (n >= p || n < 0) t.fail()
  }

  t.end()
})

tape('randombytes_buf', function (t) {
  var buf = null

  buf = alloc(10)
  sodium.randombytes_buf(buf)
  t.notEqual(buf, alloc(10), 'not blank')

  buf = alloc(1024)
  sodium.randombytes_buf(buf)
  t.notEqual(buf, alloc(1024), 'large not blank')

  t.end()
})

tape('randombytes_deterministic', function (t) {
  var seed1 = Buffer.allocUnsafe(sodium.randombytes_SEEDBYTES)
  var seed2 = Buffer.allocUnsafe(sodium.randombytes_SEEDBYTES)
  var buf1 = alloc(10)
  var buf2 = alloc(10)

  for (var i = 0; i < 1e6; i++) {
    sodium.randombytes_buf(seed1)
    sodium.randombytes_buf(seed2)

    sodium.randombytes_buf_deterministic(buf1, seed1)
    sodium.randombytes_buf_deterministic(buf2, seed1)
    if (!buf1.equals(buf2)) t.fail('should equal')

    sodium.randombytes_buf_deterministic(buf1, seed1)
    sodium.randombytes_buf_deterministic(buf2, seed2)
    if (buf1.equals(buf2)) t.fail('should not equal')

    sodium.randombytes_buf_deterministic(buf1, seed2)
    sodium.randombytes_buf_deterministic(buf2, seed1)
    if (buf1.equals(buf2)) t.fail('should not equal')

    sodium.randombytes_buf_deterministic(buf1, seed2)
    sodium.randombytes_buf_deterministic(buf2, seed2)
    if (!buf1.equals(buf2)) t.fail('should equal')
  }

  t.end()
})
