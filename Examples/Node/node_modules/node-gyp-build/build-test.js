#!/usr/bin/env node

process.env.NODE_ENV = 'test'

var path = require('path')
var test = null

try {
  test = require(path.join(process.cwd(), 'package.json')).prebuild.test
} catch (err) {
  //  do nothing
}

if (test) require(path.join(process.cwd(), test))
else require('./')()
