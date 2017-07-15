# `secure-password`

[![Build Status](https://travis-ci.org/emilbayes/secure-password.svg?branch=master)](https://travis-ci.org/emilbayes/secure-password)

> Making Password storage safer for all

## Features

- State of the art password hashing algorithm (Argon2i)
- Safe defaults for most applications
- Transparent queuing to prevent resource exhaustion
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

    if (result === securePassword.INVALID_UNRECOGNIZED_HASH) return console.error('This hash was not made with secure-password. Attempt legacy algorithm')
    if (result === securePassword.INVALID) return console.log('Imma call the cops')
    if (result === securePassword.VALID) return console.log('Yay you made it')
    if (result === securePassword.VALID_NEEDS_REHASH) {
      console.log('Yay you made it, wait for us to improve your safety')

      pwd.hash(userPassword, function (err, improvedHash) {
        if (err) console.error('You are authenticated, but we could not improve your safety this time around')

        // Save improvedHash somewhere
      })
    }
  })
})
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
  opslimit: securePassword.OPSLIMIT_DEFAULT,
  parallel: 4
})
```

* `opts.memlimit` controls how many bytes can be used for each password. It must
  be a value between `SecurePassword.MEMLIMIT_MIN` - `SecurePassword.MEMLIMIT_MAX`
* `opts.opslimit` can be viewed as how many passes are done over the memory. It
  must be a value between `SecurePassword.OPSLIMIT_MIN` -
  `SecurePassword.OPSLIMIT_MAX`.
* `opts.parallel` controls how many simultaneous calls to `hash` or `verify` can
  be run, as to prevent your server from running out of memory.

  It will default to `4`, which is the current number of worker threads available
  to Node.js. If you increase this value, you should also set `UV_THREADPOOL_SIZE`
  to the same value or more, as this environment variable determines the number
  of workers available to Node.js. This is done at startup, like this:

  ```sh
  UV_THREADPOOL_SIZE=8 node index.js
  ```

All these options should be set as high as you can afford. Take into account the
resources you have available on your production machines, and adjust
accordingly.

The settings can be easily increased at a later time as hardware most likely
improves (Moore's law) and adversaries therefore get more powerful. If a hash is
attempted verified with weaker parameters than your current settings, you get a
special return code signalling that you need to rehash the plaintext password
according to the updated policy. In contrast to other modules, this module will
not increase these settings automatically as this can have ill effects on
services that are not carefully monitored.

### `var cancel = pwd.hash(password, function (err, hash) {})`

Takes Buffer `password` and hashes it. You can call `cancel` to abort the hashing.

The hashing is done by a seperate worker as to not block the event loop,
so normal execution and I/O can continue. The callback is invoked with a
potential error, or the Buffer `hash`.

* `password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
* `hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.
* `cancel` is a method that will abort the hashing, if it has not yet started,
and invoke `cb` with and error that has `err.cancelled === true`

### `var hash = pwd.hashSync(password)`

Takes Buffer `password` and hashes it. The hashing is done on the same thread as
the event loop, therefore normal execution and I/O will be blocked.
The function may `throw` a potential error, but most likely return
the Buffer `hash`.

`password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
`hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.

### `var cancel = pwd.verify(password, hash, function (err, enum) {})`

Takes Buffer `password` and hashes it and then safely compares it to the
Buffer `hash`. The hashing is done by a seperate worker as to not block the
event loop, so normal execution and I/O can continue.
The callback is invoked with a potential error, or one of the enums
`SecurePassword.INVALID`, `SecurePassword.VALID`, `SecurePassword.NEEDS_REHASH` or `SecurePassword.INVALID_UNRECOGNIZED_HASH`.
Check with strict equality for one the cases as in the example above.

If `enum === SecurePassword.NEEDS_REHASH` you should call `pwd.hash` with
`password` and save the new `hash` for next time. Be careful not to introduce a
bug where a user trying to login multiple times, successfully, in quick succession
makes your server do unnecessary work.

`password` must be a Buffer of length `SecurePassword.PASSWORD_BYTES_MIN` - `SecurePassword.PASSWORD_BYTES_MAX`.  
`hash` will be a Buffer of length `SecurePassword.HASH_BYTES`.

### `var enum = pwd.verifySync(password, hash)`

Takes Buffer `password` and hashes it and then safely compares it to the
Buffer `hash`. The hashing is done on the same thread as the event loop,
therefore normal execution and I/O will be blocked.
The function may `throw` a potential error, or return one of the enums
`SecurePassword.VALID`, `SecurePassword.INVALID`, `SecurePassword.NEEDS_REHASH` or `SecurePassword.INVALID_UNRECOGNIZED_HASH`.
Check with strict equality for one the cases as in the example above.

### `pwd.pending`

Number of hash / verify tasks pending.

### `pwd.parallel`

Number of hash / verify tasks that can be processed simultaneously. Can be set
through the constructor, but is **read-only**.

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
