# sodium-native

Low level bindings for [libsodium](https://github.com/jedisct1/libsodium).

```
npm install sodium-native
```

[![build status](https://travis-ci.org/sodium-friends/sodium-native.svg?branch=master)](https://travis-ci.org/sodium-friends/sodium-native)
[![build status](https://ci.appveyor.com/api/projects/status/8wi3my2clf1ami6k/branch/master?svg=true)](https://ci.appveyor.com/project/mafintosh/sodium-native/branch/master)


The goal of this project is to be thin, stable, unopionated wrapper around libsodium.

All methods exposed are more or less a direct translation of the libsodium c-api.
This means that most data types are buffers and you have to manage allocating return values and passing them in as arguments intead of receiving them as return values.

This makes this API harder to use than other libsodium wrappers out there, but also means that you'll be able to get a lot of perf / memory improvements as you can do stuff like inline encryption / decryption, re-use buffers etc.

This also makes this library useful as a foundation for more high level crypto abstractions that you want to make.

## Usage

``` js
var sodium = require('sodium-native')

var nonce = new Buffer(sodium.crypto_secretbox_NONCEBYTES)
var key = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES) // secure buffer
var message = new Buffer('Hello, World!')
var cipher = new Buffer(message.length + sodium.crypto_secretbox_MACBYTES)

sodium.randombytes_buf(nonce) // insert random data into nonce
sodium.randombytes_buf(key)  // insert random data into key

// encrypted message is stored in cipher.
sodium.crypto_secretbox_easy(cipher, message, nonce, key)

console.log('Encrypted message:', cipher)

var plainText = new Buffer(cipher.length - sodium.crypto_secretbox_MACBYTES)

if (!sodium.crypto_secretbox_open_easy(plainText, cipher, nonce, key)) {
  console.log('Decryption failed!')
} else {
  console.log('Decrypted message:', plainText, '(' + plainText.toString() + ')')
}
```

## API

[**Go to docs for the latest release**](https://github.com/sodium-friends/sodium-native/tree/v2.1.4) (The following docs may be for a unreleased version)

#### `var sodium = require('sodium-native')`

Loads the bindings. If you get an module version error you probably need to reinstall the module because you switched node versions.

### Memory Protection

Bindings to the secure memory API.
[See the libsodium "Securing memory allocations" docs for more information](https://download.libsodium.org/doc/helpers/memory_management.html).

#### `sodium.sodium_memzero(buffer)`

Zero out the data in `buffer`.

#### `sodium.sodium_mlock(buffer)`

Lock the memory contained in `buffer`

#### `sodium.sodium_munlock(buffer)`

Unlock previously `sodium_mlock`ed memory contained in `buffer`. This will also `sodium_memzero` `buffer`

#### `var buffer = sodium.sodium_malloc(size)`

Allocate a buffer of `size` which is memory protected. See [libsodium docs](https://download.libsodium.org/doc/helpers/memory_management.html#guarded-heap-allocations) for details. Be aware that many Buffer methods may break the security guarantees of `sodium.sodium_malloc`'ed memory. To check if a `Buffer` is a "secure" buffer,
you can call access the getter `buffer.secure` which will be `true`.

#### `sodium.sodium_mprotect_noaccess(buffer)`

Make `buffer` allocated using `sodium.sodium_malloc` inaccessible, crashing the process if any access is attempted.
Note that this will have no effect for normal `Buffer`s.

#### `sodium.sodium_mprotect_readonly(buffer)`

Make `buffer` allocated using `sodium.sodium_malloc` read-only, crashing the process if any writing is attempted.
Note that this will have no effect for normal `Buffer`s.

#### `sodium.sodium_mprotect_readwrite(buffer)`

Make `buffer` allocated using `sodium.sodium_malloc` read-write, undoing `sodium_mprotect_noaccess` or `sodium_mprotect_readonly`.
Note that this will have no effect for normal `Buffer`s.

### Generating random data

Bindings to the random data generation API.
[See the libsodium randombytes docs for more information](https://download.libsodium.org/doc/generating_random_data/).

#### `var uint32 = sodium.randombytes_random()`

Generate a random 32-bit unsigned integer `[0, 0xffffffff]` (both inclusive)

#### `var uint = sodium.randombytes_uniform(upper_bound)`

Generate a random 32-bit unsigned integer `[0, upper_bound)` (last exclusive).
`upper_bound` must be `0xffffffff` at most.

#### `sodium.randombytes_buf(buffer)`

Fill `buffer` with random data.

#### `sodium.randombytes_buf_deterministic(buffer, seed)`

Fill `buffer` with random data, generated from `seed`. `seed` must be a Buffer
of at least `sodium.randombytes_SEEDBYTES` length

### Padding

Bindings to the padding API.
[See the libsodium padding docs for more information](https://download.libsodium.org/doc/helpers/padding.html).

#### `var paddedLength = sodium.sodium_pad(buf, unpaddedLength, blocksize)`

Pad `buf` with random data from index `unpaddedLength` up to closest multiple of
`blocksize`.

* `buf` must be `Buffer`
* `unpadded_buflen` must be integer at most `buf.length`
* `blocksize` must be integer greater than 1 but at most `buf.length`

Returns the length of the padded data (so you may `.slice` the buffer to here).

#### `var unpaddedLength = sodium.sodium_unpad(buf, paddedLength, blocksize)`

Calculate `unpaddedLength` from a padded `buf` with `blocksize`

* `buf` must be `Buffer`
* `padded_buflen` must be integer at most `buf.length`
* `blocksize` must be integer greater than 1 but at most `buf.length`

Returns the length of the unpadded data (so you may `.slice` the buffer to here).

### Signing

Bindings for the crypto_sign API.
[See the libsodium crypto_sign docs for more information](https://download.libsodium.org/doc/public-key_cryptography/public-key_signatures.html).

#### `crypto_sign_seed_keypair(publicKey, secretKey, seed)`

Create a new keypair based on a seed.

* `publicKey` should be a buffer with length `crypto_sign_PUBLICKEYBYTES`.
* `secretKey` should be a buffer with length `crypto_sign_SECRETKEYBYTES`.
* `seed` should be a buffer with length `crypto_sign_SEEDBYTES`.

The generated public and secret key will be stored in passed in buffers.

#### `crypto_sign_keypair(publicKey, secretKey)`

Create a new keypair.

* `publicKey` should be a buffer with length `crypto_sign_PUBLICKEYBYTES`.
* `secretKey` should be a buffer with length `crypto_sign_SECRETKEYBYTES`.

The generated public and secret key will be stored in passed in buffers.

#### `crypto_sign(signedMessage, message, secretKey)`

Sign a message.

* `signedMessage` should be a buffer with length `crypto_sign_BYTES + message.length`.
* `message` should be a buffer of any length.
* `secretKey` should be a secret key.

The generated signed message will be stored in `signedMessage`.

#### `var bool = crypto_sign_open(message, signedMessage, publicKey)`

Verify and open a message.

* `message` should be a buffer with length `signedMessage.length - crypto_sign_BYTES`.
* `signedMessage` at least `crypto_sign_BYTES` length.
* `publicKey` should be a public key.

Will return `true` if the message could be verified. Otherwise `false`.
If verified the originally signed message is stored in the `message` buffer.

#### `crypto_sign_detached(signature, message, secretKey)`

Same as `crypto_sign` except it only stores the signature.

* `signature` should be a buffer with length `crypto_sign_BYTES`.
* `message` should be a buffer of any length.
* `secretKey` should be a secret key.

The generated signature is stored in `signature`.

#### `var bool = crypto_sign_verify_detached(signature, message, publicKey)`

Verify a signature.

* `signature` should be a buffer with length `crypto_sign_BYTES`.
* `message` should be a buffer of any length.
* `publicKey` should be a public key.

Will return `true` if the message could be verified. Otherwise `false`.

#### `crypto_sign_ed25519_pk_to_curve25519(curve_pk, ed_pk)`

convert a ed25519 public key to curve25519 (which can be used with `box` and `scalarmult`)
* `curve_pk` should be a buffer with length `crypto_box_PUBLICKEYBYTES`
* `ed_pk` should be a buffer with length `crypto_sign_PUBLICKEYBYTES`

#### `crypto_sign_ed25519_sk_to_curve25519(curve_sk, ed_sk)`

convert a ed25519 secret key to curve25519 (which can be used with `box` and `scalarmult`)
* `curve_sk` should be a buffer with length `crypto_box_SECRETKEYBYTES`
* `ed_sk` should be a buffer with length `crypto_sign_SECRETKEYBYTES`

### Generic hashing

Bindings for the crypto_generichash API.
[See the libsodium crypto_generichash docs for more information](https://download.libsodium.org/doc/hashing/generic_hashing.html).

#### `crypto_generichash(output, input, [key])`

Hash a value with an optional key using the generichash method.

* `output` should be a buffer with length within `crypto_generichash_BYTES_MIN` - `crypto_generichash_BYTES_MAX`.
* `input` should be a buffer of any length.
* `key` is an optional buffer of length within `crypto_generichash_KEYBYTES_MIN` - `crypto_generichash_KEYBYTES_MAX`.

The generated hash is stored in `output`.

Also exposes `crypto_generichash_BYTES` and `crypto_generichash_KEYBYTES` that can be used as "default" buffer sizes.

#### `crypto_generichash_batch(output, inputArray, [key])`

Same as `crypto_generichash` except this hashes an array of buffers instead of a single one.

#### `var instance = crypto_generichash_instance([key], [outputLength])`

Create a generichash instance that can hash a stream of input buffers.

* `key` is an optional buffer as above.
* `outputLength` the buffer size of your output.

#### `instance.update(input)`

Update the instance with a new piece of data.

* `input` should be a buffer of any size.

#### `instance.final(output)`

Finalize the instance.

* `output` should be a buffer as above with the same length you gave when creating the instance.

The generated hash is stored in `output`.

### Public / secret key box encryption

Bindings for the crypto_box API.
[See the libsodium crypto_box docs for more information](https://download.libsodium.org/doc/public-key_cryptography/authenticated_encryption.html).

#### `crypto_box_seed_keypair(publicKey, secretKey, seed)`

Create a new keypair based on a seed.

* `publicKey` should be a buffer with length `crypto_box_PUBLICKEYBYTES`.
* `secretKey` should be a buffer with length `crypto_box_SECRETKEYBYTES`.
* `seed` should be a buffer with length `crypto_box_SEEDBYTES`.

The generated public and secret key will be stored in passed in buffers.

#### `crypto_box_keypair(publicKey, secretKey)`

Create a new keypair.

* `publicKey` should be a buffer with length `crypto_box_PUBLICKEYBYTES`.
* `secretKey` should be a buffer with length `crypto_box_SECRETKEYBYTES`.

The generated public and secret key will be stored in passed in buffers.

#### `crypto_box_detached(cipher, mac, message, nonce, publicKey, secretKey)`

Encrypt a message.

* `cipher` should be a buffer with length `message.length`.
* `mac` should be a buffer with length `crypto_box_MACBYTES`.
* `message` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_box_NONCEBYTES`.
* `publicKey` should be a public key.
* `secretKey` should be a secret key.

The encrypted message will be stored in `cipher` and the authentification code will be stored in `mac`.

#### `crypto_box_easy(cipher, message, nonce, publicKey, secretKey)`

Same as `crypto_box_detached` except it encodes the mac in the message.

* `cipher` should be a buffer with length `message.length + crypto_box_MACBYTES`.
* `message` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_box_NONCEBYTES`.
* `publicKey` should be a public key.
* `secretKey` should be a secret key.

The encrypted message and authentification code  will be stored in `cipher`.

#### `var bool = crypto_box_open_detached(message, cipher, mac, nonce, publicKey, secretKey)`

Decrypt a message.

* `message` should be a buffer with length `cipher.length`.
* `mac` should be a buffer with length `crypto_box_MACBYTES`.
* `cipher` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_box_NONCEBYTES`.
* `publicKey` should be a public key.
* `secretKey` should be a secret key.

Returns `true` if the message could be decrypted. Otherwise `false`.

The decrypted message will be stored in `message`.

#### `var bool = crypto_box_open_easy(message, cipher, nonce, publicKey, secretKey)`

Decrypt a message encoded with the easy method.

* `message` should be a buffer with length `cipher.length - crypto_box_MACBYTES`.
* `cipher` should be a buffer with length at least `crypto_box_MACBYTES`.
* `nonce` should be a buffer with length `crypto_box_NONCEBYTES`.
* `publicKey` should be a public key.
* `secretKey` should be a secret key.

Returns `true` if the message could be decrypted. Otherwise `false`.

The decrypted message will be stored in `message`.

### Sealed box encryption

Bindings for the crypto_box_seal API.
[See the libsodium crypto_box_seal docs for more information](https://download.libsodium.org/doc/public-key_cryptography/sealed_boxes.html).

Keypairs can be generated with `crypto_box_keypair()` or `crypto_box_seed_keypair()`.

#### `crypto_box_seal(cipher, message, publicKey)`

Encrypt a message in a sealed box using a throwaway keypair.
The ciphertext cannot be associated with the sender due to the sender's key
being a single use keypair that is overwritten during encryption.

* `cipher` should be a buffer with length at least `message.length + crypto_box_SEALBYTES`.
* `message` should be a buffer with any length.
* `publicKey` should be the receipent's public key.

#### `var bool = crypto_box_seal_open(message, cipher, publicKey, secretKey)`

Decrypt a message encoded with the sealed box method.

* `message` should be a buffer with length at least  `cipher.length - crypto_box_SEALBYTES`.
* `cipher` should be a buffer with length at least `crypto_box_SEALBYTES`.
* `publicKey` should be the receipient's public key.
* `secretKey` should be the receipient's secret key.

Note: the keypair of the recipient is required here, both public and secret key.
This is because during encryption the recipient's public key is used to generate
the nonce. The throwaway public key generated by the sender is stored in the first
`crypto_box_PUBLICKEYBYTE`'s of the ciphertext.

### Secret key box encryption

Bindings for the crypto_secretbox API.
[See the libsodium crypto_secretbox docs for more information](https://download.libsodium.org/doc/secret-key_cryptography/authenticated_encryption.html).

#### `crypto_secretbox_detached(cipher, mac, message, nonce, secretKey)`

Encrypt a message.

* `cipher` should be a buffer with length `message.length`.
* `mac` should be a buffer with length `crypto_secretbox_MACBYTES`.
* `message` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_secretbox_NONCEBYTES`.
* `secretKey` should be a secret key with legnth `crypto_secretbox_KEYBYTES`.

The encrypted message will be stored in `cipher` and the authentification code will be stored in `mac`.

#### `crypto_secretbox_easy(cipher, message, nonce, secretKey)`

Same as `crypto_secretbox_detached` except it encodes the mac in the message.

* `cipher` should be a buffer with length `message.length + crypto_secretbox_MACBYTES`.
* `message` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_secretbox_NONCEBYTES`.
* `secretKey` should be a secret key with legnth `crypto_secretbox_KEYBYTES`.

#### `var bool = crypto_secretbox_open_detached(message, cipher, mac, nonce, secretKey)`

Decrypt a message.

* `message` should be a buffer with length `cipher.length`.
* `mac` should be a buffer with length `crypto_secretbox_MACBYTES`.
* `cipher` should be a buffer of any length.
* `nonce` should be a buffer with length `crypto_secretbox_NONCEBYTES`.
* `secretKey` should be a secret key.

Returns `true` if the message could be decrypted. Otherwise `false`.

The decrypted message will be stored in `message`.

#### `var bool = crypto_secretbox_open_easy(message, cipher, nonce, secretKey)`

Decrypt a message encoded with the easy method.

* `message` should be a buffer with length `cipher.length - crypto_secretbox_MACBYTES`.
* `cipher` should be a buffer with length at least `crypto_secretbox_MACBYTES`.
* `nonce` should be a buffer with length `crypto_secretbox_NONCEBYTES`.
* `secretKey` should be a secret key.

Returns `true` if the message could be decrypted. Otherwise `false`.

The decrypted message will be stored in `message`.

### Non-authenticated streaming encryption

Bindings for the crypto_stream API.
[See the libsodium crypto_stream docs for more information](https://download.libsodium.org/doc/advanced/xsalsa20.html).

#### `crypto_stream(cipher, nonce, key)`

Generate random data based on a nonce and key into the cipher.

* `cipher` should be a buffer of any size.
* `nonce` should be a buffer with length `crypto_stream_NONCEBYTES`.
* `key` should be a secret key with length `crypto_stream_KEYBYTES`.

The generated data is stored in `cipher`.

#### `crypto_stream_xor(cipher, message, nonce, key)` or
#### `crypto_stream_chacha20_xor(cipher, message, nonce, key)`

Encrypt, but *not* authenticate, a message based on a nonce and key

* `cipher` should be a buffer with length `message.length`.
* `message` should be a buffer of any size.
* `nonce` should be a buffer with length `crypto_stream_NONCEBYTES`.
* `key` should be a secret key with length `crypto_stream_KEYBYTES`.

The encrypted data is stored in `cipher`. To decrypt, swap `cipher` and `message`.
Also supports in-place encryption where you use the same buffer as `cipher` and `message`.

Encryption defaults to XSalsa20, use `crypto_stream_chacha20_xor` if you want
to encrypt/decrypt with ChaCha20 instead.

#### `var instance = crypto_stream_xor_instance(nonce, key)` or
#### `var instance = crypto_stream_chacha20_xor_instance(nonce, key)`

A streaming instance to the `crypto_stream_xor` api. Pass a nonce and key in the constructor.

Encryption defaults to XSalsa20, use `crypto_stream_chacha20_xor_instance` if
you want to encrypt/decrypt with ChaCha20 instead.

#### `instance.update(cipher, message)`

Encrypt the next message

#### `instance.final()`

Finalize the stream. Zeros out internal state.

### Authentication

Bindings for the crypto_auth API.
[See the libsodium crypto_auth docs for more information](https://download.libsodium.org/doc/secret-key_cryptography/secret-key_authentication.html).

#### `crypto_auth(output, input, key)`

Create an authentication token.

* `output` should be a buffer of length `crypto_auth_BYTES`.
* `input` should be a buffer of any size.
* `key` should be a buffer of lenght `crypto_auth_KEYBYTES`.

The generated token is stored in `output`.

#### `var bool = crypto_auth_verify(output, input, key)`

Verify a token.

* `output` should be a buffer of length `crypto_auth_BYTES`.
* `input` should be a buffer of any size.
* `key` should be a buffer of lenght `crypto_auth_KEYBYTES`.

Returns `true` if the token could be verified. Otherwise `false`.

### Stream encryption

Bindings for the crypto_secretstream API.
[See the libsodium crypto_secretstream docs for more information](https://download.libsodium.org/doc/secret-key_cryptography/secretstream.html).

### Constants

#### Buffer lengths (Integer)

- `crypto_secretstream_xchacha20poly1305_ABYTES`
- `crypto_secretstream_xchacha20poly1305_HEADERBYTES`
- `crypto_secretstream_xchacha20poly1305_KEYBYTES`
- `crypto_secretstream_xchacha20poly1305_MESSAGEBYTES_MAX`
- `crypto_secretstream_xchacha20poly1305_TAGBYTES` - NOTE: Unofficial constant

#### Message tags (`Buffer`)

- `crypto_secretstream_xchacha20poly1305_TAG_MESSAGE`
- `crypto_secretstream_xchacha20poly1305_TAG_PUSH`
- `crypto_secretstream_xchacha20poly1305_TAG_REKEY`
- `crypto_secretstream_xchacha20poly1305_TAG_FINAL`

### `crypto_secretstream_xchacha20poly1305_keygen(key)`

Generate a new encryption key.

* `key` should be a buffer of length `crypto_secretstream_xchacha20poly1305_KEYBYTES`.

The generated key is stored in `key`.

### `var state = crypto_secretstream_xchacha20poly1305_state_new()`

Create a new stream state. Returns an opaque object used in the next methods.

### `crypto_secretstream_xchacha20poly1305_init_push(state, header, key)`

Initialise `state` from the writer side with message `header` and
encryption key `key`. The header must be sent or stored with the stream.
The key must be exchanged securely with the receiving / reading side.

* `state` should be an opaque state object.
* `header` should be a buffer of size `crypto_secretstream_xchacha20poly1305_HEADERBYTES`.
* `key` should be a buffer of length `crypto_secretstream_xchacha20poly1305_KEYBYTES`.

### `var mlen = crypto_secretstream_xchacha20poly1305_push(state, ciphertext, message, [ad], tag)`

Encrypt a message with a certain tag and optional additional data `ad`.

* `state` should be an opaque state object.
* `ciphertext` should be a buffer of size `message.length + crypto_secretstream_xchacha20poly1305_ABYTES`.
* `message` should be a buffer.
* `ad` is optional and should be `null` or `Buffer`. Included in the computation
  of authentication tag appended to the message.
* `tag` should be `Buffer` of length `crypto_secretstream_xchacha20poly1305_TAGBYTES`

Note that `tag` should be one of the `crypto_secretstream_xchacha20poly1305_TAG_*` constants.
Returns number of encrypted bytes written to `ciphertext`.

### `crypto_secretstream_xchacha20poly1305_init_pull(state, header, key)`

Initialise `state` from the reader side with message `header` and
encryption key `key`. The header must be retrieved from somewhere.
The key must be exchanged securely with the sending / writing side.

* `state` should be an opaque state object.
* `header` should be a buffer of size `crypto_secretstream_xchacha20poly1305_HEADERBYTES`.
* `key` should be a buffer of length `crypto_secretstream_xchacha20poly1305_KEYBYTES`.

### `var clen = crypto_secretstream_xchacha20poly1305_pull(state, message, tag, ciphertext, [ad])`

Decrypt a message with optional additional data `ad`, and write message tag to
`tag`. Make sure to check this!

* `state` should be an opaque state object.
* `message` should be a buffer of size `ciphertext.length - crypto_secretstream_xchacha20poly1305_ABYTES`.
* `tag` should be a buffer of `crypto_secretstream_xchacha20poly1305_TAGBYTES`.
* `ad` is optional and should be `null` or `Buffer`. Included in the computation
  of the authentication tag appended to the message.

Note that `tag` should be one of the `crypto_secretstream_xchacha20poly1305_TAG_*` constants.
Returns number of decrypted bytes written to `message`.

### `crypto_secretstream_xchacha20poly1305_rekey(state)`

Rekey the opaque `state` object.

### One-time Authentication

Bindings for the crypto_onetimeauth API.
[See the libsodium crypto_onetimeauth docs for more information](https://download.libsodium.org/doc/advanced/poly1305.html).

#### `crypto_onetimeauth(output, input, key)`

Create a authentication token based on a onetime key.

* `output` should be a buffer of length `crypto_onetimauth_BYTES`.
* `input` should be a buffer of any size.
* `key` should be a buffer of lenght `crypto_onetimeauth_KEYBYTES`.

The generated token is stored in `output`.

#### `var bool = crypto_onetimeauth_verify(output, input, key)`

Verify a token.

* `output` should be a buffer of length `crypto_onetimeauth_BYTES`.
* `input` should be a buffer of any size.
* `key` should be a buffer of lenght `crypto_onetimeauth_KEYBYTES`.

Returns `true` if the token could be verified. Otherwise `false`.

#### `var instance = crypto_onetimeauth_instance(key)`

Create an instance that create a token from a onetime key and a stream of input data.

* `key` should be a buffer of length `crypto_onetimeauth_KEYBYTES`.

#### `instance.update(input)`

Update the instance with a new piece of data.

* `input` should be a buffer of any size.

#### `instance.final(output)`

Finalize the instance.

* `output` should be a buffer of length `crypto_onetimeauth_BYTES`.

The generated hash is stored in `output`.

### Password Hashing

Bindings for the crypto_pwhash API.
[See the libsodium crypto_pwhash docs for more information](https://download.libsodium.org/doc/password_hashing/).

#### `crypto_pwhash(output, password, salt, opslimit, memlimit, algorithm)`

Create a password hash.

* `output` should be a buffer with length within `crypto_pwhash_BYTES_MIN` - `crypto_pwhash_BYTES_MAX`.
* `password` should be a buffer of any size.
* `salt` should be a buffer with length `crypto_pwhash_SALTBYTES`.
* `opslimit` should a be number containing your ops limit setting in the range `crypto_pwhash_OPSLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.
* `memlimit` should a be number containing your mem limit setting in the range `crypto_pwhash_MEMLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.
* `algorithm` should be a number specifying the algorithm you want to use.

Available default ops and mem limits are

* `crypto_pwhash_OPSLIMIT_INTERACTIVE`
* `crypto_pwhash_OPSLIMIT_MODERATE`
* `crypto_pwhash_OPSLIMIT_SENSITIVE`
* `crypto_pwhash_MEMLIMIT_INTERACTIVE`
* `crypto_pwhash_MEMLIMIT_MODERATE`
* `crypto_pwhash_MEMLIMIT_SENSITIVE`

The available algorithms are

* `crypto_pwhash_ALG_DEFAULT`
* `crypto_pwhash_ALG_ARGON2ID13`
* `crypto_pwhash_ALG_ARGON2I13`

The generated hash will be stored in `output` and the entire `output` buffer will be used.

#### `crypto_pwhash_str(output, password, opslimit, memlimit)`

Create a password hash with a random salt.

* `output` should be a buffer with length `crypto_pwhash_STRBYTES`.
* `password` should be a buffer of any size.
* `opslimit` should a be number containing your ops limit setting in the range `crypto_pwhash_OPSLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.
* `memlimit` should a be number containing your mem limit setting in the range `crypto_pwhash_MEMLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.

The generated hash, settings, salt, version and algorithm will be stored in `output` and the entire `output` buffer will be used.

#### `var bool = crypto_pwhash_str_verify(str, password)`

Verify a password hash generated with the above method.

* `str` should be a buffer with length `crypto_pwhash_STRBYTES`.
* `password` should be a buffer of any size.

Returns `true` if the hash could be verified with the settings contained in `str`. Otherwise `false`.

#### `var bool = crypto_pwhash_str_needs_rehash(hash, opslimit, memlimit)`

Check if a password hash needs rehash, either because the default algorithm
changed, opslimit or memlimit increased or because the hash is malformed.

* `hash` should be a buffer with length `crypto_pwhash_STRBYTES`.
* `opslimit` should a be number containing your ops limit setting in the range `crypto_pwhash_OPSLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.
* `memlimit` should a be number containing your mem limit setting in the range `crypto_pwhash_MEMLIMIT_MIN` - `crypto_pwhash_OPSLIMIT_MAX`.

Returns `true` if the hash should be rehashed the settings contained in `str`.
Otherwise `false` if it is still good.

#### `crypto_pwhash_async(output, password, salt, opslimit, memlimit, algorithm, callback)`

Just like `crypto_pwhash` but will run password hashing on a seperate worker so it will not block the event loop. `callback(err)` will receive any errors from the hashing but all argument errors will `throw`. The resulting hash is written to `output`.

#### `crypto_pwhash_str_async(output, password, opslimit, memlimit, callback)`

Just like `crypto_pwhash_str` but will run password hashing on a seperate worker so it will not block the event loop. `callback(err)` will receive any errors from the hashing but all argument errors will `throw`. The resulting hash with parameters is written to `output`.

#### `crypto_pwhash_str_verify_async(str, password, callback)`

Just like `crypto_pwhash_str_verify` but will run password hashing on a seperate worker so it will not block the event loop. `callback(err, bool)` will receive any errors from the hashing but all argument errors will `throw`. If the verification succeeds `bool` is `true`, otherwise `false`. Due to an issue with libsodium `err` is currently never set.

### Key exchange

Bindings for the crypto_kx API.
[See the libsodium crypto_kx docs for more information](https://download.libsodium.org/doc/key_exchange/).

#### `crypto_kx_keypair(publicKey, secretKey)`

Create a key exchange key pair.

* `publicKey` should be a buffer of length `crypto_kx_PUBLICKEYBYTES`.
* `secretKey` should be a buffer of length `crypto_kx_SECRETKEYBYTES`.

#### `crypto_kx_seed_keypair(publicKey, secretKey, seed)`

Create a key exchange key pair based on a seed.

* `publicKey` should be a buffer of length `crypto_kx_PUBLICKEYBYTES`.
* `secretKey` should be a buffer of length `crypto_kx_SECRETKEYBYTES`.
* `seed` should be a buffer of length `crypto_kx_SEEDBYTES`

#### `crypto_kx_client_session_keys(rx, tx, clientPublicKey, clientSecretKey, serverPublicKey)`

Generate a session receive and transmission key for a client. The public / secret keys should be generated using the key pair method above.

* `rx` should be a buffer of length `crypto_kx_SESSIONKEYBYTES`.
* `tx` should be a buffer of length `crypto_kx_SESSIONKEYBYTES`.

You should use the rx to decrypt incoming data and tx to encrypt outgoing.

#### `crypto_kx_server_session_keys(rx, tx, serverPublicKey, serverSecretKey, clientPublicKey)`

Generate a session receive and transmission key for a server. The public / secret keys should be generated using the key pair method above.

* `rx` should be a buffer of length `crypto_kx_SESSIONKEYBYTES`.
* `tx` should be a buffer of length `crypto_kx_SESSIONKEYBYTES`.

You should use the rx to decrypt incoming data and tx to encrypt outgoing.

### Scalar multiplication

Bindings for the crypto_scalarmult API.
[See the libsodium crypto_scalarmult docs for more information](https://download.libsodium.org/doc/advanced/scalar_multiplication.html).

#### `crypto_scalarmult_base(publicKey, secretKey)`

Create a scalar multiplication public key based on a secret key

* `publicKey` should be a buffer of length `crypto_scalarmult_BYTES`.
* `secretKey` should be a buffer of length `crypto_scalarmult_SCALARBYTES`.

The generated public key is stored in `publicKey`.

#### `crypto_scalarmult(sharedSecret, secretKey, remotePublicKey)`

Derive a shared secret from a local secret key and a remote public key.

* `sharedSecret` shoudl be a buffer of length `crypto_scalarmult_BYTES`.
* `secretKey` should be a buffer of length `crypto_scalarmult_SCALARBYTES`.
* `remotePublicKey` should be a buffer of length `crypto_scalarmult_BYTES`.

The generated shared secret is stored in `sharedSecret`.

### Short hashes

Bindings for the crypto_shorthash API.
[See the libsodium crypto_shorthash docs for more information](https://download.libsodium.org/doc/hashing/short-input_hashing.html).

#### `crypto_shorthash(output, input, key)`

Hash a value to a short hash based on a key.

* `output` should be a buffer of length `crypto_shorthash_BYTES`.
* `input` should be a buffer of any size.
* `key` should be a buffer of length `crypto_shorthash_KEYBYTES`.

The generated short hash is stored in `output`.

### Key derivation

Bindings for the crypto_kdf API.
[See the libsodium crypto_kdf docs for more information](https://download.libsodium.org/doc/key_derivation/).

#### `crypto_kdf_keygen(key)`

Generate a new master key.

* `key` should be a buffer of length `crypto_kdf_KEYBYTES`

#### `crypto_kdf_derive_from_key(subkey, subkeyId, context, key)`

Derive a new key from a master key.

* `subkey` should be a buffer between `crypto_kdf_BYTES_MIN` and `crypto_kdf_BYTES_MAX`.
* `subkeyId` should be an integer.
* `context` should be a buffer of length `crypto_kdf_CONTEXTBYTES`
* `key` should by a buffer of length `crypto_kdf_KEYBYTES`

### SHA

#### `crypto_hash_sha256(output, input)`

Hash a value to a short hash based on a key.

* `output` should be a buffer of length `crypto_hash_sha256_BYTES`.
* `input` should be a buffer of any size.

The generated short hash is stored in `output`.

#### `var instance = crypto_hash_sha256_instance()`

Create an instance that has stream of input data to sha256.

#### `instance.update(input)`

Update the instance with a new piece of data.

* `input` should be a buffer of any size.

#### `instance.final(output)`

Finalize the instance.

* `output` should be a buffer of length `crypto_hash_sha256_BYTES`.

The generated hash is stored in `output`.

#### `crypto_hash_sha512(output, input)`

Hash a value to a short hash based on a key.

* `output` should be a buffer of length `crypto_hash_sha512_BYTES`.
* `input` should be a buffer of any size.

The generated short hash is stored in `output`.

#### `var instance = crypto_hash_sha512_instance()`

Create an instance that has stream of input data to sha512.

#### `instance.update(input)`

Update the instance with a new piece of data.

* `input` should be a buffer of any size.

#### `instance.final(output)`

Finalize the instance.

* `output` should be a buffer of length `crypto_hash_sha512_BYTES`.

The generated hash is stored in `output`.

## License

MIT
