var http = require('http')
var securePassword = require('..')

var db = new Map()
var pwdPolicy = securePassword()

var register = require('./register')(db, pwdPolicy)
var login = require('./login')(db, pwdPolicy)

var server = http.createServer(function (req, res) {
  if (req.url === '/register') return register(req, res)
  if (req.url === '/login') return login(req, res)

  return reply(res, 404)
})

var port = process.env.PORT || process.argv[2] || 8080
server.listen(port, function () {
  console.log(server.address())

  setInterval(function () {
    console.log('Queue depth: ', pwdPolicy.pending)
  }, 500)
})

function reply(res, status) {
  res.writeHead(status, http.STATUS_CODES[status], {})
  return res.end(http.STATUS_CODES[status])
}
