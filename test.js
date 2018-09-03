var test = require('tape')
var securePassword = require('.')

test('Can hash password sync', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secrets')

  var passwordHash = pwd.hashSync(userPassword)
  assert.notOk(userPassword.equals(passwordHash))
  assert.end()
})

test('Can hash password async', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secrets')

  pwd.hash(userPassword, function (err, passwordHash) {
    assert.error(err)
    assert.notOk(userPassword.equals(passwordHash))
    assert.end()
  })
})

test('Can hash password using promises', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secrets')

  pwd.hash(userPassword).then(function (passwordHash) {
    assert.notOk(userPassword.equals(passwordHash))
    assert.end()
  }, assert.error)
})

test('Can hash password async simultanious', function (assert) {
  assert.plan(4)
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
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

test('Can verify password (identity) using promises', function (assert) {
  var pwd = securePassword({
    version: 0,
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secret')

  pwd
    .hash(userPassword)
    .then(function (passwordHash) {
      return pwd.verify(userPassword, passwordHash)
    })
    .then(function (bool) {
      assert.ok(bool === securePassword.VALID)
      assert.end()
    })
    .catch(assert.error)
})

test('Needs rehash sync', function (assert) {
  var weakPwd = securePassword({
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var userPassword = Buffer.from('my secret')
  var wrongPassword = Buffer.from('my secret 2')
  var pass = Buffer.from('hello world')
  var empty = Buffer.from('')
  var argon2ipass = Buffer.from('JGFyZ29uMmkkdj0xOSRtPTMyNzY4LHQ9NCxwPTEkYnB2R2dVNjR1Q3h4TlF2aWYrd2Z3QSR3cXlWL1EvWi9UaDhVNUlaeEFBN0RWYjJVMWtLSG01VHhLOWE2QVlkOUlVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64')
  var argon2ipassempty = Buffer.from('JGFyZ29uMmkkdj0xOSRtPTMyNzY4LHQ9NCxwPTEkN3dZV0EvbjBHQjRpa3lwSWN5UVh6USRCbjd6TnNrcW03aWNwVGNjNGl6WC9xa0liNUZBQnZVNGw2MUVCaTVtaWFZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64')

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
    memlimit: securePassword.MEMLIMIT_DEFAULT + 1024,
    opslimit: securePassword.OPSLIMIT_DEFAULT + 1
  })

  var rehashValid = betterPwd.verifySync(userPassword, weakHash)

  assert.notOk(rehashValid === securePassword.VALID)
  assert.notOk(rehashValid === securePassword.INVALID)
  assert.ok(rehashValid === securePassword.VALID_NEEDS_REHASH)

  var rehashValidAlgo = betterPwd.verifySync(pass, argon2ipass)

  assert.notOk(rehashValidAlgo === securePassword.VALID)
  assert.notOk(rehashValidAlgo === securePassword.INVALID)
  assert.ok(rehashValidAlgo === securePassword.VALID_NEEDS_REHASH)

  var rehashValidAlgoEmpty = betterPwd.verifySync(empty, argon2ipassempty)

  assert.notOk(rehashValidAlgoEmpty === securePassword.VALID)
  assert.notOk(rehashValidAlgoEmpty === securePassword.INVALID)
  assert.ok(rehashValidAlgoEmpty === securePassword.VALID_NEEDS_REHASH)

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
  assert.plan(37)
  var weakPwd = securePassword({
    memlimit: securePassword.MEMLIMIT_DEFAULT,
    opslimit: securePassword.OPSLIMIT_DEFAULT
  })

  var betterPwd = securePassword({
    memlimit: securePassword.MEMLIMIT_DEFAULT + 1024,
    opslimit: securePassword.OPSLIMIT_DEFAULT + 1
  })

  var userPassword = Buffer.from('my secret')
  var wrongPassword = Buffer.from('my secret 2')
  var pass = Buffer.from('hello world')
  var empty = Buffer.from('')
  var argon2ipass = Buffer.from('JGFyZ29uMmkkdj0xOSRtPTMyNzY4LHQ9NCxwPTEkYnB2R2dVNjR1Q3h4TlF2aWYrd2Z3QSR3cXlWL1EvWi9UaDhVNUlaeEFBN0RWYjJVMWtLSG01VHhLOWE2QVlkOUlVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64')
  var argon2ipassempty = Buffer.from('JGFyZ29uMmkkdj0xOSRtPTMyNzY4LHQ9NCxwPTEkN3dZV0EvbjBHQjRpa3lwSWN5UVh6USRCbjd6TnNrcW03aWNwVGNjNGl6WC9xa0liNUZBQnZVNGw2MUVCaTVtaWFZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64')

  weakPwd.hash(userPassword, function (err, weakHash) {
    assert.error(err, 'hash not error')
    weakPwd.verify(userPassword, weakHash, function (err, res) {
      assert.error(err, 'weak right verify not error')
      assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH, 'weak not right unrecognized')
      assert.ok(res === securePassword.VALID, 'weak right valid')
      assert.notOk(res === securePassword.INVALID, 'weak right not invalid')
      assert.notOk(res === securePassword.VALID_NEEDS_REHASH, 'weak right not rehash')
    })

    weakPwd.verify(wrongPassword, weakHash, function (err, res) {
      assert.error(err, 'weak wrong verify not valid')
      assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH, 'weak not right unrecognized')
      assert.notOk(res === securePassword.VALID, 'weak wrong not valid')
      assert.ok(res === securePassword.INVALID, 'weak wrong invalid')
      assert.notOk(res === securePassword.VALID_NEEDS_REHASH, 'weak wrong not rehash')
    })

    betterPwd.verify(userPassword, weakHash, function (err, res) {
      assert.error(err, 'weak right not error')
      assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH, 'weak not right unrecognized')
      assert.notOk(res === securePassword.VALID, 'weak right not valid')
      assert.notOk(res === securePassword.INVALID, 'weak right not invald')
      assert.ok(res === securePassword.VALID_NEEDS_REHASH, 'weak right rehash')
    })

    weakPwd.verify(pass, argon2ipass, function (err, res) {
      assert.error(err, 'weak right not error')
      assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH, 'weak not right unrecognized')
      assert.notOk(res === securePassword.VALID, 'weak right not valid')
      assert.notOk(res === securePassword.INVALID, 'weak right not invald')
      assert.ok(res === securePassword.VALID_NEEDS_REHASH, 'weak right rehash')
    })

    weakPwd.verify(empty, argon2ipassempty, function (err, res) {
      assert.error(err, 'weak right not error')
      assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH, 'weak not right unrecognized')
      assert.notOk(res === securePassword.VALID, 'weak right not valid')
      assert.notOk(res === securePassword.INVALID, 'weak right not invald')
      assert.ok(res === securePassword.VALID_NEEDS_REHASH, 'weak right rehash')
    })

    betterPwd.hash(userPassword, function (err, betterHash) {
      assert.error(err)

      betterPwd.verify(userPassword, betterHash, function (err, res) {
        assert.error(err)
        assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH)
        assert.ok(res === securePassword.VALID)
        assert.notOk(res === securePassword.INVALID)
        assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
      })

      betterPwd.verify(wrongPassword, betterHash, function (err, res) {
        assert.error(err)
        assert.notOk(res === securePassword.INVALID_UNRECOGNIZED_HASH)
        assert.notOk(res === securePassword.VALID)
        assert.ok(res === securePassword.INVALID)
        assert.notOk(res === securePassword.VALID_NEEDS_REHASH)
      })
    })
  })
})

test('Can handle invalid hash sync', function (assert) {
  var pwd = securePassword()

  var userPassword = Buffer.from('my secret')
  var invalidHash = Buffer.allocUnsafe(securePassword.HASH_BYTES)

  var unrecognizedHash = pwd.verifySync(userPassword, invalidHash)
  assert.ok(unrecognizedHash === securePassword.INVALID_UNRECOGNIZED_HASH)
  assert.notOk(unrecognizedHash === securePassword.INVALID)
  assert.notOk(unrecognizedHash === securePassword.VALID)
  assert.notOk(unrecognizedHash === securePassword.VALID_NEEDS_REHASH)
  assert.end()
})

test('Can handle invalid hash async', function (assert) {
  var pwd = securePassword()

  var userPassword = Buffer.from('my secret')
  var invalidHash = Buffer.allocUnsafe(securePassword.HASH_BYTES)

  pwd.verify(userPassword, invalidHash, function (err, unrecognizedHash) {
    assert.error(err)
    assert.ok(unrecognizedHash === securePassword.INVALID_UNRECOGNIZED_HASH)
    assert.notOk(unrecognizedHash === securePassword.INVALID)
    assert.notOk(unrecognizedHash === securePassword.VALID)
    assert.notOk(unrecognizedHash === securePassword.VALID_NEEDS_REHASH)
    assert.end()
  })
})
