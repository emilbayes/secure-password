# continuation-local-storage support for bluebird promises

[![NPM version](https://img.shields.io/npm/v/cls-bluebird.svg)](https://www.npmjs.com/package/cls-bluebird)
[![Build Status](https://img.shields.io/travis/TimBeyer/cls-bluebird/master.svg)](http://travis-ci.org/TimBeyer/cls-bluebird)
[![Dependency Status](https://img.shields.io/david/TimBeyer/cls-bluebird.svg)](https://david-dm.org/TimBeyer/cls-bluebird)
[![Dev dependency Status](https://img.shields.io/david/dev/TimBeyer/cls-bluebird.svg)](https://david-dm.org/TimBeyer/cls-bluebird)
[![Coverage Status](https://img.shields.io/coveralls/TimBeyer/cls-bluebird/master.svg)](https://coveralls.io/r/TimBeyer/cls-bluebird)

Patch [bluebird](https://www.npmjs.com/package/bluebird) for [continuation-local-storage](https://www.npmjs.com/package/continuation-local-storage) support.

## Current Status

Version 2.x of cls-bluebird is a complete re-write aiming to make it 100% reliable and robust. Features comprehensive test coverage (over 100,000 tests) which cover pretty much all conceivable cases.

Compatible with [bluebird](https://www.npmjs.com/package/bluebird) v2.x and v3.x. Tests cover both versions.

Please use with latest version of [bluebird](https://www.npmjs.com/package/bluebird) in either v2.x or v3.x branches. Older versions are not guaranteed to work.

## Usage

### `clsBluebird( ns [, Promise] )`

```js
var cls = require('continuation-local-storage');
var ns = cls.createNamespace('myNamespace');

var Promise = require('bluebird');
var clsBluebird = require('cls-bluebird');

clsBluebird( ns );
// Promise is now patched to maintain CLS context
```

The above patches the "global" instance of bluebird. So anywhere else in the same app that calls `require('bluebird')` will get the patched version (assuming npm resolves to the same file).

### Patching a particular instance of Bluebird

So as not to alter the "global" instance of bluebird, it's recommended to first create a independent instance of the Bluebird constructor before patching, and pass it to cls-bluebird.

This is a more robust approach.

```js
var Promise = require('bluebird').getNewLibraryCopy();
var clsBluebird = require('cls-bluebird');

clsBluebird( ns, Promise );
```

(see [Promise.getNewLibraryCopy()](http://bluebirdjs.com/docs/api/promise.getnewlibrarycopy.html) docs on Bluebird website)

### Nature of patching

Combining CLS and promises is a slightly tricky business. There are 3 different conventions one could use (see [this issue](https://github.com/othiym23/node-continuation-local-storage/issues/64) for more detail).

`cls-bluebird` follows the convention of binding `.then()` callbacks **to the context in which `.then()` is called**.

```js
var promise;
ns.run(function() {
    ns.set('foo', 123);
    promise = Promise.resolve();
});

ns.run(function() {
    ns.set('foo', 456);
    promise.then(print);
});

function print() {
    console.log(ns.get('foo'));
}

// this outputs '456' (the value of `foo` at the time `.then()` was called)
```

### Notes

#### Coroutines

The patch ensures that when execution in a coroutine continues after a `yield` statement, it always does so in the CLS context *in which the coroutine started running*.

```js
var fn = Promise.coroutine(function* () {
    console.log('Context 1:', ns.get('foo'));
    yield Promise.resolve();
    console.log('Context 2:', ns.get('foo'));
});

ns.run(function(ctx) {
    ns.set('foo', 123);
    fn();
});
```

outputs:

```
Context 1: 123
Context 2: 123
```

This means:

1. If the `yield`-ed expression loses CLS context, the original CLS context will be restored after the `yield`.
2. Any code before the `yield` which changes CLS context will only be effective until the next `yield`.

#### Global error handlers

`Promise.onPossiblyUnhandledRejection()` and `Promise.onUnhandledRejectionHandled()` allow you to attach global handlers to intercept unhandled rejections.

The CLS context in which callbacks are called is unknown. It's probably unwise to rely on the CLS context in the callback being that when the rejection occurred - use `.catch()` on the end of the promise chain that's created within `namespace.run()` instead.

#### Progression

Bluebird v2.x contains a deprecated API for handling progression (`.progressed()`) etc. These methods are patched and *should* work fine but they're not covered by the tests.

## Tests

The tests cover every possible combination of input promises and callbacks that the Bluebird API allows. There's around 100,000 tests in total and the aim is to ensure cls-bluebird is as robust and reliable as possible.

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

For more info on test tests, see [tests/README.md](https://github.com/TimBeyer/cls-bluebird/blob/master/test/README.md)

## Changelog

See [changelog.md](https://github.com/TimBeyer/cls-bluebird/blob/master/changelog.md)

## Issues/bugs

If you discover a bug, please raise an issue on Github. https://github.com/TimBeyer/cls-bluebird/issues

We are very keen to ensure cls-bluebird is completely bug-free and any bugs discovered will be fixed as soon as possible.

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
