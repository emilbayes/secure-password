var test = require('tape')
var securePassword = require('.')

test('Can hash password sync', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_INTERACTIVE,
    opslimit: securePassword.OPSLIMIT_INTERACTIVE
  })

  var userPassword = Buffer.from('my secrets')

  var passwordHash = pwd.hashSync(userPassword)
  assert.notOk(userPassword.equals(passwordHash))
  assert.end()
})

test('Can hash password async', function (assert) {
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

test('Can hash password async simultanious', function (assert) {
  assert.plan(4)
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_INTERACTIVE,
    opslimit: securePassword.OPSLIMIT_INTERACTIVE
  })

  var userPassword = Buffer.from('my secrets')

  pwd.hash(userPassword, function (err, passwordHash) {
    assert.error(err)
    assert.notOk(userPassword.equals(passwordHash))
  })

  pwd.hash(userPassword, function (err, passwordHash) {
    assert.error(err)
    assert.notOk(userPassword.equals(passwordHash))
  })
})

test('Can verify password (identity) sync', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secret')

  var passwordHash = pwd.hashSync(userPassword)

  assert.ok(pwd.verifySync(userPassword, passwordHash) === securePassword.VALID)
  assert.end()
})

test('Can verify password (identity) async', function (assert) {
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

test('Needs rehash sync', function (assert) {
  var weakPwd = securePassword({
    memlimit: 1 << 16,
    opslimit: 3
  })

  var userPassword = Buffer.from('my secret')
  var wrongPassword = Buffer.from('my secret 2')

  var weakHash = weakPwd.hashSync(userPassword)
  var weakValid = weakPwd.verifySync(userPassword, weakHash)
  assert.ok(weakValid === securePassword.VALID)
  assert.notOk(weakValid === securePassword.INVALID)
  assert.notOk(weakValid === securePassword.VALID_NEEDS_REHASH)

  var weakInvalid = weakPwd.verifySync(wrongPassword, weakHash)
  assert.notOk(weakInvalid === securePassword.VALID)
  assert.ok(weakInvalid === securePassword.INVALID)
  assert.notOk(weakInvalid === securePassword.VALID_NEEDS_REHASH)

  var betterPwd = securePassword({
    memlimit: 1 << 17,
    opslimit: 4
  })

  var rehashValid = betterPwd.verifySync(userPassword, weakHash)

  assert.notOk(rehashValid === securePassword.VALID)
  assert.notOk(rehashValid === securePassword.INVALID)
  assert.ok(rehashValid === securePassword.VALID_NEEDS_REHASH)

  var betterHash = betterPwd.hashSync(userPassword)
  var betterValid = betterPwd.verifySync(userPassword, betterHash)
  assert.ok(betterValid === securePassword.VALID)
  assert.notOk(betterValid === securePassword.INVALID)
  assert.notOk(betterValid === securePassword.VALID_NEEDS_REHASH)

  var betterInvalid = betterPwd.verifySync(wrongPassword, betterHash)
  assert.notOk(betterInvalid === securePassword.VALID)
  assert.ok(betterInvalid === securePassword.INVALID)
  assert.notOk(betterInvalid === securePassword.VALID_NEEDS_REHASH)
  assert.end()
})

test('Needs rehash async', function (assert) {
  assert.plan(22)
  var weakPwd = securePassword({
    memlimit: 1 << 16,
    opslimit: 3
  })

  var betterPwd = securePassword({
    memlimit: 1 << 17,
    opslimit: 4
  })

  var userPassword = Buffer.from('my secret')
  var wrongPassword = Buffer.from('my secret 2')

  weakPwd.hash(userPassword, function (err, weakHash) {
    assert.error(err)
    weakPwd.verify(userPassword, weakHash, function (err, res) {
      assert.error(err)
      assert.ok(res === securePassword.VALID)
      assert.notOk(res === securePassword.INVALID)
      assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
    })

    weakPwd.verify(wrongPassword, weakHash, function (err, res) {
      assert.error(err)
      assert.notOk(res === securePassword.VALID)
      assert.ok(res === securePassword.INVALID)
      assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
    })

    betterPwd.verify(userPassword, weakHash, function (err, res) {
      assert.error(err)
      assert.notOk(res === securePassword.VALID)
      assert.notOk(res === securePassword.INVALID)
      assert.ok(res === securePassword.VALID_NEEDS_REHASH)
    })

    betterPwd.hash(userPassword, function (err, betterHash) {
      assert.error(err)

      betterPwd.verify(userPassword, betterHash, function (err, res) {
        assert.error(err)
        assert.ok(res === securePassword.VALID)
        assert.notOk(res === securePassword.INVALID)
        assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
      })

      betterPwd.verify(wrongPassword, betterHash, function (err, res) {
        assert.error(err)
        assert.notOk(res === securePassword.VALID)
        assert.ok(res === securePassword.INVALID)
        assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
      })
    })
  })
})
