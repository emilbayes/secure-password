'use strict';

/*
 * cls-bluebird
 * Function to shim `Promise.coroutine`
 *
 * Works by binding the `.next()` and `.throw()` methods of generator to CLS context
 * at time when coroutine is executed.
 *
 * In bluebird v3.x, running the coroutine internally calls `.lastly()` if cancellation is enabled.
 * To prevent unnecessary binding of the `.lastly()` callback to CLS context, this patch
 * temporarily disables the patch on `Promise.prototype.lastly`.
 * NB This patch could break if bluebird internals change, but this is covered by the tests.
 */

// Modules
var shimmer = require('shimmer');

// Exports

/**
 * Patch `Promise.coroutine` or `Promise.spawn` to maintain current CLS context after all `yield` statements.
 *
 * @param {string} methodName - method name (either 'coroutine' or 'spawn')
 * @param {Function} Promise - Bluebird Promise constructor to patch
 * @param {Object} ns - CLS namespace to bind callbacks to
 * @returns {undefined}
 */
module.exports = function(methodName, Promise, ns, v3) {
	var lastlyPatched = Promise.prototype.lastly,
		lastlyOriginal = Promise.prototype.lastly.__original;

	// Patch method
	shimmer.wrap(Promise, methodName, function(original) {
		return function(generatorFunction, options) {
			// NB If `generatorFunction` is not a function, do not alter it.
			// Pass value directly to bluebird which will throw an error.
			if (typeof generatorFunction === 'function') {
				// Create proxy generator function
				var generatorFunctionOriginal = generatorFunction;
				generatorFunction = function() {
					// Create generator from generator function
					var generator = generatorFunctionOriginal.apply(this, arguments);

					// Bind `.next()`, '.throw()' and `.return()` to current CLS context.
					// NB CLS context is from when coroutine is called, not when created.
					['next', 'throw', 'return'].forEach(function(name) {
						if (typeof generator[name] === 'function') generator[name] = ns.bind(generator[name]);
					});

					return generator;
				};
			}

			// Temporarily remove patch from `Promise.prototype.lastly` in bluebird v3
			// to avoid unnecessary binding to CLS context.
			var self = this;
			if (methodName === 'spawn' && v3) {
				return tempPatchLastly(function() {
					return original.call(self, generatorFunction, options);
				});
			}

			var fn = original.call(this, generatorFunction, options);

			if (methodName === 'coroutine' && v3) {
				return function() {
					var self = this, args = arguments;
					return tempPatchLastly(function() {
						return fn.apply(self, args);
					});
				};
			}

			return fn;
		};
	});

	function tempPatchLastly(fn) {
		Promise.prototype.lastly = lastlyOriginal;
		var res = fn();
		Promise.prototype.lastly = lastlyPatched;
		return res;
	}
};
