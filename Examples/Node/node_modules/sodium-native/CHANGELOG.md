# CHANGELOG

## v2.1.5

Fixes a critical bug in `crypto_secretstream_xchacha20poly1305_init_push` where
it would call `crypto_secretstream_xchacha20poly1305_init_pull` instead.

## v2.1.4

Only use the constants that `libsodium` compiled with instead of the ones that
`sodium-native` compiled with. This has caused bugs for some users and may have
led to subtle bugs.

## v2.1.3

Rework build process so it is more versatile on UNIX operating systems by
parsing the libtool archive files for correct .so name. This fixes builds on
OpenBSD (#54)

## v2.1.2

Fix `armv7l` builds.

## v2.1.1

A mistake was made in generating prebuilds for v2.1.0, this version resolves the
issue.

## v2.1.0
- Upgrade to libsodium 1.0.16
- Expose the new `crypto_secretstream` API
- Expose `crypto_kx` API
- Expose `sodium_pad` and `sodium_unpad` APIs
- Expose `crypto_pwhash_str_needs_rehash`
- Expose `randombytes_SEEDBYTES` `randombytes_random`, `randombytes_uniform` and
  `randombytes_buf_deterministic`
- Check for `NULL` on `sodium_malloc`
- All "Secure Buffers" (created with `sodium_malloc`) now have an immutable
  `.secure = true` property
