'use strict';

/*
 * cls-bluebird
 * Module entry point
 */

// Modules
var isBluebird = require('is-bluebird');

// Require Bluebird library
// Ignore errors if cannot be required
var Bluebird;
try {
	Bluebird = require('bluebird');
} catch (err) {}

// Imports
var shimMethod = require('./shimMethod'),
	shimOnCancel = require('./shimOnCancel'),
	shimCall = require('./shimCall'),
	shimUsing = require('./shimUsing'),
	shimCoroutine = require('./shimCoroutine');

// Exports

/**
 * Patch bluebird to run maintain CLS context for a specific namespace.
 * If a Bluebird Promise constructor is provided, it is patched.
 * If not provided, the version returned by `require('bluebird')` is used.
 *
 * @param {Object} ns - CLS namespace object
 * @param {Function} [Promise] - Bluebird Promise constructor to patch (optional)
 * @returns {Function} - Bluebird Promise constructor
 * @throws {TypeError} - If `ns` or `Promise` are not of correct type
 * @throws {Error} - If `Promise` not provided and cannot require `bluebird` module
 */
module.exports = function patchBluebird(ns, Promise) {
	// Check namespace is valid
	if (!ns || typeof ns !== 'object' || typeof ns.bind !== 'function' || typeof ns.run !== 'function') throw new TypeError('Must provide CLS namespace to patch Bluebird against');

	// Check Promise implementation is some variation of Bluebird
	// If none provided, use default Bluebird
	if (!Promise) {
		Promise = Bluebird;
		if (!Promise) throw new Error('Could not require Bluebird');
	} else if (!isBluebird.ctor(Promise)) {
		throw new TypeError('Promise implementation provided must be Bluebird');
	}

	// Patch all methods to carry CLS context
	var v3 = isBluebird.ctor.v3(Promise);

	/*
	 * Core
	 *
	 * Not patched as always run callback synchronously:
	 *   new Promise()
	 *   Promise.try() / Promise.attempt()
	 *
	 * Not patched as do not take a callback:
	 *   Promise.bind() / .bind()
	 *   Promise.resolve() / Promise.fulfilled() / Promise.cast()
	 *   Promise.reject() / Promise.rejected()
	 *
	 * Not patched as call another patched method synchronously
	 *   .error() - calls .catch()
	 *
	 * Not patched as are wrappers:
	 *   Promise.method()
	 *
	 * NB Due to bug in bluebird v2 https://github.com/petkaantonov/bluebird/issues/1153
	 * `Promise.join()` calls the callback synchronously if input is only values or
	 * resolved promises, but async if any promises are pending.
	 * So handler is sometimes bound to CLS context unnecessarily, but this does no harm
	 * beyond the very slight performance overhead of an extra `ns.bind()` call.
	 */

	shimProto('then', v3 ? [0, 1] : [0, 1, 2]);
	shimProto('spread', v3 ? [0] : [0, 1]);
	shimProto('finally', [0]);
	Promise.prototype.lastly = Promise.prototype.finally;
	shimStatic('join', [-1]);

	if (!v3) {
		// Only patched in bluebird v2.
		// In bluebird v3 `.catch()` calls `.then()` immediately which binds callback.
		shimProto('catch', [-1]);
		Promise.prototype.caught = Promise.prototype.catch;
	}

	/*
	 * Synchronous inspection
	 *
	 * Not patched as do not take a callback:
	 *   .isFulfilled()
	 *   .isRejected()
	 *   .isPending()
	 *   .isCancelled()
	 *   .isResolved()
	 *   .value()
	 *   .reason()
	 *   .reflect()
	 */

	/*
	 * Collections
	 *
	 * Not patched as do not take a callback:
	 *   Promise.all() / .all()
	 *   Promise.props() / .props()
	 *   Promise.any() / .any()
	 *   Promise.some() / .some()
	 *   Promise.race() / .race()
	 */

	shimBoth('map', [0]);
	shimBoth('filter', [0]);
	shimBoth('reduce', [0]);
	shimBoth('each', [0]);

	// In bluebird v2, there is no `Promise.mapSeries()`/`.mapSeries()` method
	if (v3) shimBoth('mapSeries', [0]);

	/*
	 * Resource management
	 *
	 * NB disposer callbacks are bound to context at time disposer created, not when utilized in `using()`
	 */

	shimUsing(Promise, ns, v3); // shims `Promise.using()`
	shimProto('disposer', [0]);

	/*
	 * Promisification
	 *
	 * Not patched as always run callback synchronously:
	 *   Promise.fromCallback()
	 *   Promise.fromNode()
	 *
	 * Not patched as they are wrappers:
	 *   Promise.promisify()
	 *   Promise.promisifyAll()
	 */

	shimProto('asCallback', [0]);
	Promise.prototype.nodeify = Promise.prototype.asCallback;

	/*
	 * Timers
	 *
	 * Not patched as do not take a callback:
	 *   Promise.delay() / .delay()
	 *   .timeout()
	 */

	/*
	 * Cancellation
	 *
	 * Not patched as does not take a callback:
	 *   .cancel() / .break()
	 *   .isCancellable()
	 *   .cancellable() (bluebird v2 only)
	 *   .uncancellable() (bluebird v2 only)
	 *
	 * NB In bluebird v3 `onCancel` handler will be called
	 * in CLS context of call to `onCancel()`.
	 */

	// Patch `Promise.prototype._resolveFromExecutor`
	// in order to patch `onCancel` handler in `new Promise()`.
	if (v3) shimOnCancel(Promise, ns);

	/*
	 * Generators
	 *
	 * Not patched as does not take a callback:
	 *   Promise.coroutine.addYieldHandler()
	 *
	 * NB `options.yieldHandler` will run in whatever CLS context is active at time of `yield`
	 */

	var addYieldHandler = Promise.coroutine.addYieldHandler;
	shimCoroutine('coroutine', Promise, ns, v3); // shims `Promise.coroutine()`
	Promise.coroutine.addYieldHandler = addYieldHandler;

	/*
	 * Utility
	 *
	 * Not patched as do not take a callback:
	 *   .get()
	 *   .return() / .thenReturn()
	 *   .throw() / .thenThrow()
	 *   .catchReturn()
	 *   .catchThrow()
	 *   Promise.getNewLibraryCopy()
	 *   Promise.noConflict()
	 *   Promise.setScheduler()
	 */

	shimProto('tap', [0]);
	if (v3) shimProto('tapCatch', [-1]);
	shimCall(Promise, ns); // shims `.call()`

	/*
	 * Configuration
	 *
	 * Not patched as do not take a callback:
	 *   Promise.config()
	 *   .suppressUnhandledRejections()
	 *   Promise.longStackTraces()
	 *   Promise.hasLongStackTraces()
	 *
	 * Not patched as meaningless to do so:
	 *   Promise.onPossiblyUnhandledRejection()
	 *   Promise.onUnhandledRejectionHandled()
	 *
	 * NB Error handlers will run with unknown CLS context.
	 * CLS context should not be relied upon to be the context at the time error was thrown.
	 * Catch errors with `.catch()` instead!
	 */

	shimProto('done', v3 ? [0, 1] : [0, 1, 2]);

	/*
	 * Progression (bluebird v2 only)
	 */

	if (!v3) shimProto('progressed', [0]);

	/*
	 * Undocumented
	 *
	 * Not patched as do not take a callback:
	 *   Promise.is()
	 *   Promise.settle() / .settle()
	 *   Promise.defer() / Promise.pending()
	 *   .toString()
	 *   .toJSON()
	 */

	// `.fork()` does not exist in bluebird v3
	if (!v3) shimProto('fork', [0, 1, 2]);

	shimCoroutine('spawn', Promise, ns, v3); // shims `Promise.spawn()`

	// Return patched Bluebird constructor
	return Promise;

	/*
	 * Patching functions
	 */
	function shimStatic(methodName, args) {
		shimMethod(Promise, methodName, args, ns);
	}

	function shimProto(methodName, args) {
		shimMethod(Promise.prototype, methodName, args, ns);
	}

	function shimBoth(methodName, args) {
		shimProto(methodName, args);
		shimStatic(methodName, args.map(function(arg) { return arg < 0 ? arg : arg + 1; }));
	}
};
