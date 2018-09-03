# `secure-password`

[![Build Status](https://travis-ci.org/emilbayes/secure-password.svg?branch=master)](https://travis-ci.org/emilbayes/secure-password)
[![Build status](https://ci.appveyor.com/api/projects/status/a1atq7xypwf3ebfc/branch/master?svg=true)](https://ci.appveyor.com/project/emilbayes/secure-password/branch/master)

> Making Password storage safer for all

## Features

- State of the art password hashing algorithm (Argon2id)
- Safe defaults for most applications
- Future-proof so work factors and hashing algorithms can be easily upgraded
- `Buffers` everywhere for safer memory management

## Usage

```js
var securePassword = require('secure-password')

// Initialise our password policy
var pwd = securePassword()

var userPassword = Buffer.from('my secret password')

// Register user
pwd.hash(userPassword, function (err, hash) {
  if (err) throw err

  // Save hash somewhere
  pwd.verify(userPassword, hash, function (err, result) {
    if (err) throw err
    
    switch (result) {
      case securePassword.INVALID_UNRECOGNIZED_HASH:
        return console.error('This hash was not made with secure-password. Attempt legacy algorithm')
      case securePassword.INVALID:
        return console.log('Invalid password')
      case securePassword.VALID:
        return console.log('Authenticated')
      case securePassword.VALID_NEEDS_REHASH:
        console.log('Yay you made it, wait for us to improve your safety')

        pwd.hash(userPassword, function (err, improvedHash) {
          if (err) console.error('You are authenticated, but we could not improve your safety this time around')

          // Save improvedHash somewhere
        })
        break
    }
  })
})
```

or with async await:


```js
const securePassword = require('secure-password')

// Initialise our password policy
const pwd = securePassword()

const userPassword = Buffer.from('my secret password')

async function run () {
  // Register user
  const hash = await pwd.hash(userPassword)

  // Save hash somewhere
  const result = await pwd.verify(userPassword, hash)
  
  switch (result) {
    case securePassword.INVALID_UNRECOGNIZED_HASH:
      return console.error('This hash was not made with secure-password. Attempt legacy algorithm')
    case securePassword.INVALID:
      return console.log('Invalid password')
    case securePassword.VALID:
      return console.log('Authenticated')
    case securePassword.VALID_NEEDS_REHASH:
      console.log('Yay you made it, wait for us to improve your safety')

      try {
        const improvedHash = await pwd.hash(userPassword)
        // Save improvedHash somewhere
      } catch (err)
        console.error('You are authenticated, but we could not improve your safety this time around')
      }
      break
  }
}

run()
```

## API

### `var pwd = new SecurePassword(opts)`

Make a new instance of `SecurePassword` which will contain your settings. You
can view this as a password policy for your application. `opts` takes the
following keys:

```js
// Initialise our password policy (these are the defaults)
var pwd = securePassword({
  memlimit: securePassword.MEMLIMIT_DEFAULT,
  opslimit: securePassword.OPSLIMIT_DEFAULT
})
```

They're both constrained by the constants `SecurePassword.MEMLIMIT_MIN` -
 `SecurePassword.MEMLIMIT_MAX` and
`SecurePassword.OPSLIMIT_MIN` - `SecurePassword.OPSLIMIT_MAX`. If not provided
they will be given the default values `SecurePassword.MEMLIMIT_DEFAULT` and
`SecurePassword.OPSLIMIT_DEFAULT` which should be fast enough for a general
purpose web server without your users noticing too much of a load time. However
your should set these as high as possible to make any kind of cracking as costly
as possible. A load time of 1s seems reasonable for login, so test various
settings in your production environment.

The settings can be easily increased at a later time as hardware most likely
improves (Moore's law) and adversaries therefore get more powerful. If a hash is
attempted verified with weaker parameters than your current settings, you get a
special return code signalling that you need to rehash the plaintext password
according to the updated policy. In contrast to other modules, this module will
not increase these settings automatically as this can have ill effects on
services that are not carefully monitored.

### `pwd.hash(password, [function (err, hash) {}])`

Takes Buffer `password` and hashes it. You can call `cancel` to abort the hashing.

The hashing is done by a seperate worker as to not block the event loop,
so normal execution and I/O can continue. The callback is invoked with a
potential error, or the Buffer `hash`.

* `password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
* `hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.

If a callback is not specified, a `Promise` is returned.

### `var hash = pwd.hashSync(password)`

Takes Buffer `password` and hashes it. The hashing is done on the same thread as
the event loop, therefore normal execution and I/O will be blocked.
The function may `throw` a potential error, but most likely return
the Buffer `hash`.

`password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
`hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.

### `pwd.verify(password, hash, [function (err, enum) {}])`

Takes Buffer `password` and hashes it and then safely compares it to the
Buffer `hash`. The hashing is done by a seperate worker as to not block the
event loop, so normal execution and I/O can continue.
The callback is invoked with a potential error, or one of the symbols
`SecurePassword.INVALID`, `SecurePassword.VALID`, `SecurePassword.NEEDS_REHASH` or `SecurePassword.INVALID_UNRECOGNIZED_HASH`.
Check with strict equality for one the cases as in the example above.

If `enum === SecurePassword.NEEDS_REHASH` you should call `pwd.hash` with
`password` and save the new `hash` for next time. Be careful not to introduce a
bug where a user trying to login multiple times, successfully, in quick succession
makes your server do unnecessary work.

`password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
`hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.

If a callback is not specified, a `Promise` is returned.

### `var enum = pwd.verifySync(password, hash)`

Takes Buffer `password` and hashes it and then safely compares it to the
Buffer `hash`. The hashing is done on the same thread as the event loop,
therefore normal execution and I/O will be blocked.
The function may `throw` a potential error, or return one of the symbols
`SecurePassword.VALID`, `SecurePassword.INVALID`, `SecurePassword.NEEDS_REHASH` or `SecurePassword.INVALID_UNRECOGNIZED_HASH`.
Check with strict equality for one the cases as in the example above.

### `SecurePassword.VALID`

The password was verified and is valid

### `SecurePassword.INVALID`

The password was invalid

### `SecurePassword.VALID_NEEDS_REHASH`

The password was verified and is valid, but needs to be rehashed with new
parameters

### `SecurePassword.INVALID_UNRECOGNIZED_HASH`

The hash was unrecognized and therefore could not be verified.
As an implementation detail it is currently very cheap to attempt verifying
unrecognized hashes, since this only requires some lightweight pattern matching.

### `SecurePassword.HASH_BYTES`

Size of the `hash` Buffer returned by `hash` and `hashSync` and used by `verify`
and `verifySync`.

### `SecurePassword.PASSWORD_BYTES_MIN`

Minimum length of the `password` Buffer.

### `SecurePassword.PASSWORD_BYTES_MAX`

Maximum length of the `password` Buffer.

### `SecurePassword.MEMLIMIT_MIN`

Minimum value for the `opts.memlimit` option.

### `SecurePassword.MEMLIMIT_MAX`

Maximum value for the `opts.memlimit` option.

### `SecurePassword.OPSLIMIT_MIN`

Minimum value for the `opts.opslimit` option.

### `SecurePassword.OPSLIMIT_MAX`

Maximum value for the `opts.opslimit` option.

### `SecurePassword.MEMLIMIT_DEFAULT`

Default value for the `opts.memlimit` option.

### `SecurePassword.OPSLIMIT_DEFAULT`

Minimum value for the `opts.opslimit` option.

## Install

```sh
npm install secure-password
```

## Credits

I want to thank [Tom Streller](https://github.com/scan) for donating the package
name on npm. The `<1.0.0` versions that he had written and published to npm can
still be downloaded and the source is available in his [`scan/secure-password` repository](https://github.com/scan/secure-password)

## License

[ISC](LICENSE.md)
