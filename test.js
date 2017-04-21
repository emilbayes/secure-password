var test = require('tape')
var securePassword = require('.')

test('Can hash password', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_INTERACTIVE,
    opslimit: securePassword.OPSLIMIT_INTERACTIVE
  })

  var userPassword = Buffer.from('my secrets')

  pwd.hash(userPassword, function (err, passwordHash) {
    assert.error(err)
    assert.notOk(userPassword.equals(passwordHash))
    assert.end()
  })
})

test('Can verify password (identity)', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secret')

  pwd.hash(userPassword, function (err, passwordHash) {
    assert.error(err)
    pwd.verify(userPassword, passwordHash, function (err, bool) {
      assert.error(err)
      assert.ok(bool === securePassword.VALID)
      assert.end()
    })
  })
})

test('Needs rehash', function (assert) {
  var weakPwd = securePassword({
    memlimit: 1 << 16,
    opslimit: 3
  })

  var userPassword = Buffer.from('my secret')
  var weakHash = weakPwd.hashSync(userPassword)
  assert.ok(weakPwd.verifySync(userPassword, weakHash) === securePassword.VALID, 'valid but does not need rehash')

  var betterPwd = securePassword({
    memlimit: 1 << 32,
    opslimit: 4
  })

  assert.ok(betterPwd.verifySync(userPassword, weakHash) === securePassword.NEEDS_REHASH, 'should still verify but needs rehash')

  var betterHash = betterPwd.hashSync(userPassword)
  assert.ok(betterPwd.verifySync(userPassword, betterHash) === securePassword.VALID, 'valid but does not need rehash (up-to-date)')
  assert.end()
})
