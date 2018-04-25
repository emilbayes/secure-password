var alloc = require('buffer-alloc')
var tape = require('tape')
var sodium = require('../')
var fork = require('child_process').fork

tape('sodium_memzero', function (t) {
  var buf = alloc(10)
  var exp = alloc(10)
  var zero = alloc(10)
  buf.fill(0xab)
  exp.fill(0xab)

  t.same(buf, exp, 'buffers start out with same content')
  t.notSame(buf, zero, 'buffer is not zero')

  sodium.sodium_memzero(buf)
  t.notSame(buf, exp, 'buffers are not longer the same')
  t.same(buf, zero, 'buffer is now zeroed')

  t.end()
})

tape('sodium_mlock / sodium_munlock', function (t) {
  var buf = alloc(10)
  var exp = alloc(10)

  buf.fill(0x18)
  exp.fill(0x18)
  sodium.sodium_mlock(buf)
  t.notOk(buf.secure)
  t.same(buf, exp, 'mlock did not corrupt data')
  sodium.sodium_munlock(buf)
  t.notOk(buf.secure)
  t.same(buf, alloc(10), 'munlock did zero data')

  t.end()
})

tape('sodium_malloc', function (t) {
  var empty = sodium.sodium_malloc(0)
  var small = sodium.sodium_malloc(1)
  var large = sodium.sodium_malloc(1e8)

  t.ok(empty.secure)
  t.ok(small.secure)
  t.ok(large.secure)

  t.ok(empty.length === 0, 'has correct size')
  t.ok(small.length === 1, 'has correct size')
  t.same(small, Buffer([0xdb]), 'has canary content')
  t.ok(large.length === 1e8, 'has correct size')

  // test gc
  for (var i = 0; i < 1e3; i++) {
    if (sodium.sodium_malloc(256).length !== 256) {
      t.fail('allocated incorrect size')
    }
  }
  t.ok(empty.length === 0, 'retained correct size')
  t.ok(small.length === 1, 'retained correct size')
  t.ok(large.length === 1e8, 'retained correct size')

  t.end()
})

tape('sodium_malloc .secure read-only', function (t) {
  var buf = sodium.sodium_malloc(1)

  t.ok(buf.secure)
  buf.secure = false
  t.ok(buf.secure)
  t.end()
})

tape('sodium_malloc bounds', function (t) {
  t.throws(function () {
    sodium.sodium_malloc(-1)
  }, 'too small')
  t.throws(function () {
    sodium.sodium_malloc(Number.MAX_SAFE_INTEGER)
  }, 'too large')
  t.end()
})

tape('sodium_mprotect_noaccess', function (t) {
  t.plan(1)
  var p = fork(require.resolve('./fixtures/mprotect_noaccess'))

  p.on('message', function () {
    t.fail()
  })
  p.on('exit', function (code, signal) {
    t.ok(p.signalCode !== null || p.exitCode > 0)
  })
})

tape('sodium_mprotect_readonly', function (t) {
  t.plan(2)
  var p = fork(require.resolve('./fixtures/mprotect_readonly'))

  p.on('message', function (msg) {
    t.ok(msg === 'read')
  })
  p.on('exit', function (code, signal) {
    t.ok(p.signalCode !== null || p.exitCode > 0)
  })
})

tape('sodium_mprotect_readwrite', function (t) {
  t.plan(4)
  var p = fork(require.resolve('./fixtures/mprotect_readwrite'))

  p.on('message', function (msg) {
    switch (msg) {
      case 'read': t.pass()
        break
      case 'write': t.pass()
        break
      case 'did_write': t.pass()
        break
      case 'did_not_write': t.fail()
        break
      default: t.fail()
        break
    }
  })
  p.on('exit', function (code, signal) {
    t.ok(p.signalCode === null || p.exitCode === 0)
  })
})
