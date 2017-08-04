# Example

This is example of how I would implement `secure-password` in a HTTP server for
authentication. It does not cover password recovery, session tokens, revocation,
change of password etc.

It does however cover registration and login, which both have some subtle
security and concurrency issues that you should be aware of and can be hard to
spot.

- [`register.js`](register.js) covers initial user registration
- [`login.js`](login.js) covers authentication

Both files have comments at the top covering issues that you should be aware of
and illustrate an example solution using `secure-password` and related modules.
