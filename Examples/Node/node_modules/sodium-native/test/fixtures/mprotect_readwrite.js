var sodium = require('../..')
var buf = sodium.sodium_malloc(1)
sodium.sodium_mprotect_noaccess(buf)
sodium.sodium_mprotect_readwrite(buf)
buf[0]
process.send('read')
buf[0] = 1
process.send('write')
sodium.sodium_mprotect_readonly(buf)
process.send(buf[0] === 1 ? 'did_write' : 'did_not_write')
