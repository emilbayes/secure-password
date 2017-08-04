var http = require('http')

var payload = `username=${Math.random()}&password=secret`
var req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(payload)
  }
}, function (res) {
  res.on('data', d => console.log(d.toString()))
})

req.once('socket', function () {
  req.end(payload, null, function () {
    setTimeout(req.abort.bind(req), 80)
  })
})

req.setNoDelay(true)
req.flushHeaders()
