'use strict';

/*
 * cls-bluebird
 * Function to shim `Promise.using`
 *
 * `Promise.using()` calls `.then()` and `.lastly` internally which leads to
 * unnecessary CLS context binding with a naive patch.
 *
 * This custom patch intercepts calls to `Promise.all()` (v3) or `Promise.settle()` (v2)
 * within `Promise.using()` and patches the resulting promise's `.then`/`.lastly` methods
 * so they do not bind callbacks to CLS context.
 *
 * NB This patch could break if bluebird internals change, but this is covered by the tests.
 */

// Modules
var shimmer = require('shimmer');

// Exports

/**
 * Patch `Promise.using` method to run callbacks in current CLS context.
 *
 * @param {Function} Promise - Bluebird Promise constructor to patch
 * @param {Object} ns - CLS namespace to bind callbacks to
 * @param {boolean} v3 - `true` if bluebird being patched is v3.x
 * @returns {undefined}
 */
module.exports = function(Promise, ns, v3) {
	(v3 ? patchV3 : patchV2)(Promise, ns);
};

// Patch for `Promise.using()` in bluebird v3
function patchV3(Promise, ns) {
	var thenOriginal = Promise.prototype.then.__original,
		lastlyOriginal = Promise.prototype.lastly.__original;

	// Patch method
	shimmer.wrap(Promise, 'using', function(usingOriginal) {
		return function() {
			// Bind `using` callback (last arg)
			var argIndex = arguments.length - 1,
				callback = arguments[argIndex];
			if (typeof callback === 'function') arguments[argIndex] = ns.bind(callback);

			// Temporarily patch `Promise.all()`
			shimmer.wrap(Promise, 'all', function(allOriginal) {
				return function(promises) {
					// Remove temporary patch on `Promise.all()`
					Promise.all = allOriginal;

					// Call original `Promise.all()`
					var p = allOriginal.call(this, promises);

					// Patch `.then()` method on this promise to not bind callbacks
					p.then = function() {
						var p = thenOriginal.apply(this, arguments);

						// Patch `.lastly()` method on this promise to not bind callbacks
						p.lastly = lastlyOriginal;
						
						return p;
					};

					return p;
				};
			});

			// Call original `Promise.using()` method
			return usingOriginal.apply(this, arguments);
		};
	});
}

// Patch for `Promise.using()` in bluebird v2
function patchV2(Promise, ns) {
	var thenOriginal = Promise.prototype.then.__original;

	// Patch method
	shimmer.wrap(Promise, 'using', function(usingOriginal) {
		return function() {
			// Bind `using` callback (last arg)
			var argIndex = arguments.length - 1,
				callback = arguments[argIndex];
			if (typeof callback === 'function') arguments[argIndex] = ns.bind(callback);

			// Temporarily patch `Promise.settle()`
			shimmer.wrap(Promise, 'settle', function(settleOriginal) {
				return function(resources) {
					// Remove temporary patch on `Promise.settle()`
					Promise.settle = settleOriginal;

					// Call original `Promise.settle()`
					var p = settleOriginal.call(this, resources);

					// Patch `.then()` method on this promise to not bind callbacks
					p.then = function() {
						var p = thenOriginal.apply(this, arguments);

						// Patch `.then()` method on this promise to not bind callbacks
						p.then = thenOriginal;
						return p;
					};

					return p;
				};
			});

			// Call original `Promise.using()` method
			return usingOriginal.apply(this, arguments);
		};
	});
}
