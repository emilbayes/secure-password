#!/usr/bin/env node

var proc = require('child_process')
var os = require('os')

proc.exec('node-gyp-build-test', function (err) {
  if (err) preinstall()
})

function build () {
  proc.spawn(os.platform() === 'win32' ? 'node-gyp.cmd' : 'node-gyp', ['rebuild'], {stdio: 'inherit'}).on('exit', function (code) {
    if (code || !process.argv[3]) process.exit(code)
    exec(process.argv[3]).on('exit', function (code) {
      process.exit(code)
    })
  })
}

function preinstall () {
  if (!process.argv[2]) return build()
  exec(process.argv[2]).on('exit', function (code) {
    if (code) process.exit(code)
    build()
  })
}

function exec (cmd) {
  if (process.platform !== 'win32') {
    var shell = os.platform() === 'android' ? 'sh' : '/bin/sh'
    return proc.spawn(shell, ['-c', cmd], {
      stdio: 'inherit'
    })
  }

  return proc.spawn(process.env.comspec || 'cmd.exe', ['/s', '/c', '"' + cmd + '"'], {
    windowsVerbatimArguments: true,
    stdio: 'inherit'
  })
}
