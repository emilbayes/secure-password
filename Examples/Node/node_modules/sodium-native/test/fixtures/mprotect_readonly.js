var sodium = require('../..')
var buf = sodium.sodium_malloc(1)
sodium.sodium_mprotect_readonly(buf)
buf[0]
process.send('read')
buf[0] = 1
process.send('write')
