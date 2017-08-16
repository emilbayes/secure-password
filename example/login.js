var http = require('http')
var parse = require('buffer-urlencoded')
var concat = require('secure-concat')
var securePassword = require('..')

module.exports = function loginHandler (db, pwdPolicy) {

  // Notes:
  // * Password and hash are always Buffers for full control of the memory
  // * Once we're done using the password Buffer, we zero it out with .fill(0)
  // * We do not try to hide that a user doesn't exist. One way to do that is
  //   to hash the provided password regardless and compare to a pregenerated
  //   hash. However this would be putting strain on the server for little gain
  // * If the request is aborted (eg. the connection closed) we cancel the
  //   hashing. If the hashing has already begun it cannot be stopped, but we
  //   can finish off our work in the callback.
  // * If we have changed our password policy since the user was registered
  //   we might need to rehash, but the user does not need to wait for that
  //   so we reply and schedule a rehash in the background

  return function (req, res) {
    if (req.method !== 'POST')
      return reply(res, 405)
    if (req.headers['content-type'] !== 'application/x-www-form-urlencoded')
      return reply(res, 415)

    req.pipe(concat({limit: 1024}, function (err, buf) {
      if (err) return reply(res, 413)

      var data = parse(buf)

      if (data.username == null || data.password == null) return reply(res, 400)
      if (data.username.length < 1) return reply(res, 400)

      var username = data.username.toString()
      var password = data.password
      var hash = db.get(username)

      if (!hash) {
        password.fill(0)
        return reply(res, 404)
      }

      var cancel = pwdPolicy.verify(password, hash, function (err, result) {
        req.removeListener('aborted', cancel)
        if (err) {
          password.fill(0)
          return reply(res, 500)
        }

        switch (result) {
          case securePassword.INVALID_UNRECOGNIZED_HASH:
            // If we have used another password scheme previously, we can
            // attempt it here. You would want similar logic with your legacy
            // hash regarding rehashing, ie. if the password is valid, attempt
            // rehashing it to upgrade the user to the new hashing scheme.
            //
            // For this demo unrecognized hashes are invalid.
            // return attemptLegacy(req, res)

          case securePassword.INVALID:
            password.fill(0)
            return reply(res, 401)

          case securePassword.VALID:
            password.fill(0)
            return reply(res, 204)

          case securePassword.VALID_NEEDS_REHASH:
            reply(res, 204)

            // Concurrency issue here. Can DDoS by requesting rehash many times
            pwdPolicy.hash(password, function (err, rehash) {
              if (err) return

              db.set(username, rehash)
              password.fill(0)
            })
        }
      })

      req.once('aborted', cancel)
    }))

  }
}

function reply(res, status) {
  res.writeHead(status, http.STATUS_CODES[status], {})
  return res.end(http.STATUS_CODES[status])
}
