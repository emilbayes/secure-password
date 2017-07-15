var http = require('http')
var securePassword = require('..')

var db = new Map()
var pwdPolicy = securePassword()

var server = http.createServer(function (req, res) {
  if (req.url === '/register') return register(req, res)
  if (req.url === '/login') return login(req, res)

  return reply(res, 404)
})

function register (req, res) {
  var username = 'test'
  var password = Buffer.from('test')

  if (db.has(username)) return reply(res, 400)

  db.set(username, null) // Reserve username
  var cancel = pwdPolicy.hash(password, function (err, hash) {
    req.removeListener('aborted', cancel)
    password.fill(0)

    if (err) {
      if (db.get(username) === null) db.delete(username)
      return reply(res, 500)
    }

    db.set(username, hash)
    return reply(res, 202)
  })

  req.once('aborted', cancel)
}

function login (req, res) {
  var username = 'test'
  var password = Buffer.from('test')
  var hash = db.get(username)

  if (!hash) {
    password.fill(0)
    return reply(res, 400)
  }

  var cancel = pwdPolicy.verify(password, hash, function (err, result) {
    req.removeListener('aborted', cancel)
    if (err) {
      password.fill(0)
      return reply(res, 500)
    }

    switch (result) {
      case securePassword.INVALID_UNRECOGNIZED_HASH:
        return attemptLegacy(req, res)

      case securePassword.INVALID:
        password.fill(0)
        return reply(res, 400)

      case securePassword.VALID:
        password.fill(0)
        return reply(res, 200)

      case securePassword.VALID_NEEDS_REHASH:
        reply(res, 200)
        pwdPolicy.hash(password, function (err, rehash) {
          if (err) return

          db.set(username, rehash)
          password.fill(0)
        })
    }
  })

  req.once('aborted', cancel)
}

function reply(res, status) {
  res.writeHead(status, http.STATUS_CODES[status], {})
  return res.end(http.STATUS_CODES[status])
}

var port = process.env.PORT || process.argv[2] || 8080
server.listen(port, function () {
  console.log(server.address())

  setInterval(function () {
    console.log('Queue depth: ', pwdPolicy.pending)
  }, 500)
})
