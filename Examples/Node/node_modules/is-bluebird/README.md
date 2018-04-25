# is-bluebird.js

# Is this a bluebird promise I see before me?

[![NPM version](https://img.shields.io/npm/v/is-bluebird.svg)](https://www.npmjs.com/package/is-bluebird)
[![Build Status](https://img.shields.io/travis/overlookmotel/is-bluebird/master.svg)](http://travis-ci.org/overlookmotel/is-bluebird)
[![Dependency Status](https://img.shields.io/david/overlookmotel/is-bluebird.svg)](https://david-dm.org/overlookmotel/is-bluebird)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/is-bluebird.svg)](https://david-dm.org/overlookmotel/is-bluebird)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/is-bluebird/master.svg)](https://coveralls.io/r/overlookmotel/is-bluebird)

## Usage

Tools to check whether some input is a [bluebird](http://bluebirdjs.com/) promise, a bluebird promise constructor, or determining the version of bluebird from a promise or constructor.

#### `isBluebird( promise )`

Returns true if is a bluebird promise, false if not.

```js
var isBluebird = require('is-bluebird');
var Bluebird = require('bluebird');

console.log( isBluebird( Bluebird.resolve() ) ); // true
console.log( isBluebird( Promise.resolve() ) ); // false (native JS promise)
```

#### `isBluebird.ctor( Promise )`

Returns true if is bluebird promise constructor, false if not.

```js
var isBluebird = require('is-bluebird');
var Bluebird = require('bluebird');

console.log( isBluebird.ctor( Bluebird ) ); // true
console.log( isBluebird.ctor( Promise ) ); // false (native JS promise)
```

#### `isBluebird.v2( promise )` / `isBluebird.v3( promise )`

Returns true if is a bluebird promise of the specified version.

```js
var isBluebird = require('is-bluebird');
var Bluebird2 = require('bluebird2');
var Bluebird3 = require('bluebird3');

console.log( isBluebird.v2( Bluebird2.resolve() ) ); // true
console.log( isBluebird.v2( Bluebird3.resolve() ) ); // false
console.log( isBluebird.v2( Promise.resolve() ) ); // false (native JS promise)
```

#### `isBluebird.v2.ctor( Promise )` / `isBluebird.v3.ctor( Promise )`

Returns true if is bluebird promise constructor of the specified version.

```js
var isBluebird = require('is-bluebird');
var Bluebird2 = require('bluebird2');
var Bluebird3 = require('bluebird3');

console.log( isBluebird.v2.ctor( Bluebird2 ) ); // true
console.log( isBluebird.v2.ctor( Bluebird3 ) ); // false
console.log( isBluebird.v2.ctor( Promise ) ); // false (native JS promise)
```

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/is-bluebird/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/is-bluebird/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
