# Changelog

## 2.1.0

* Fix: `Promise.coroutine.addYieldHandler()` is maintained
* Patch `.tapCatch()` prototype method
* Tests: Workaround for uncaught rejections bug in Bluebird v3.5.1
* Travis CI run tests on Node versions 8 + 9
* Travis CI does not run tests on Node versions before v4
* Skip Travis CI runs on release tags
* Test against latest Bluebird v3
* Update dev dependencies
* Code style: Fix spacing in tests

## 2.0.1

* Correct typos in README

## 2.0.0

* Complete re-write
* New test suite

## 1.1.3

* Improved validation that `ns` argument is a namespace
* Add npm keywords

## 1.1.2

* README

## 1.1.1

* Use `is-bluebird` module for checking `Promise` argument

## 1.1.0

* Remove peer dependencies
* Update `shimmer` dependency

## 1.0.1

* Fix: `domain` argument for `_addCallbacks`

## 1.0.0

* Initial release
