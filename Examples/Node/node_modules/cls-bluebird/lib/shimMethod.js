'use strict';

/*
 * cls-bluebird
 * Function to shim an object method to retain CLS context
 */

// Modules
var shimmer = require('shimmer');

// Exports

/**
 * Patch method to run callbacks in current CLS context.
 *
 * @param {Object} obj - Object on which to find method
 * @param {string} methodName - method name
 * @param {Array} args - Array of indexes of arguments which are callbacks
 *   (negative numbers count from end e.g. -1 is last argument, -2 is penultimate)
 * @param {Object} ns - CLS namespace to bind callbacks to
 * @returns {undefined}
 */
module.exports = function(obj, methodName, args, ns) {
	// Skip non-existent methods
	if (!obj[methodName]) return;

	// Patch method
	shimmer.wrap(obj, methodName, function(original) {
		return function() {
			for (var i = 0; i < args.length; i++) {
				var argIndex = args[i];
				if (argIndex < 0) argIndex += arguments.length;

				var callback = arguments[argIndex];
				if (typeof callback === 'function') arguments[argIndex] = ns.bind(callback);
			}

			return original.apply(this, arguments);
		};
	});
};
