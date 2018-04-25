'use strict';

/*
 * cls-bluebird
 * Function to shim `Promise.prototype._resolveFromExecutor`
 * in order to patch `onCancel` handler in `new Promise()`.
 */

// Modules
var shimmer = require('shimmer');

// Exports

/**
 * Patch `_resolveFromExecutor` proto method to run `onCancel` callbacks in current CLS context.
 *
 * @param {Function} Promise - Bluebird Promise constructor to patch
 * @param {Object} ns - CLS namespace to bind callbacks to
 * @returns {undefined}
 */
module.exports = function(Promise, ns) {
	// Patch method
	shimmer.wrap(Promise.prototype, '_resolveFromExecutor', function(_resolveFromExecutorOriginal) {
		return function(executor) {
			// Patch executor
			var executorPatched = function() {
				var onCancel = arguments[2];
				if (onCancel) {
					// Patch onCancel function
					arguments[2] = function(fn) {
						// Bind onCancel handler to current CLS context
						if (typeof fn === 'function') fn = ns.bind(fn);
						return onCancel.call(this, fn);
					};
				}

				return executor.apply(this, arguments);
			};

			// Call original method
			return _resolveFromExecutorOriginal.call(this, executorPatched);
		};
	});
};
