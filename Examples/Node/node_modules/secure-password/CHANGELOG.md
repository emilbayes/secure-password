# CHANGELOG

## v3.0.0

* `libsodium` has changed the default algorithm from `argon2i` to the safer
  `argon2id`. This also means the parameter constants will have changed since
  they now are in adjusted to `argon2id`. Upgrading will still verify passwords
  for `argon2i`, but returns `VALID_NEEDS_REHASH`
* The enums `INVALID_UNRECOGNIZED_HASH`, `INVALID`, `VALID` and
  `VALID_NEEDS_REHASH` are now `Symbol`s to avoid bugs stemming form invalid
  checks.
