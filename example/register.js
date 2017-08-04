var http = require('http')
var parse = require('buffer-urlencoded')
var concat = require('secure-concat')

module.exports = function registerHandler (db, pwdPolicy) {

  // Notes:
  // * Password and hash are always Buffers for full control of the memory
  // * Once we're done using the password Buffer, we zero it out with .fill(0)
  // * If the request is aborted (eg. the connection closed) we cancel the
  //   hashing. If the hashing has already begun it cannot be stopped, but we
  //   can finish off our work in the callback.
  // * Registering a user has some subtle race conditions that can occur:
  //   - As soon as we start hashing the password of a user, we reserve the
  //     username by setting it's hash to null as a placeholder. A subtle detail
  //     here is that "database queries" here are sync so we can check for
  //     username availabiltiy and reserve the username in the same tick.
  //   - If the hashing failed for whatever reason (or the hashing was cancelled)
  //     we free up the username
  //   - At the end we assign the hash  to the username

  return function register (req, res) {
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

      if (db.has(username)) {
        password.fill(0)
        return reply(res, 409)
      }

      db.set(username, null) // Reserve username
      var cancel = pwdPolicy.hash(password, function (err, hash) {
        req.removeListener('aborted', cancel)
        password.fill(0)

        if (err) {
          if (db.get(username) === null) db.delete(username)
          return reply(res, 500)
        }

        db.set(username, hash)
        return reply(res, 201)
      })

      req.once('aborted', cancel)
    }))
  }
}

function reply(res, status) {
  res.writeHead(status, http.STATUS_CODES[status], {})
  return res.end(http.STATUS_CODES[status])
}
