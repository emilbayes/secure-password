'use strict';

/*
 * cls-bluebird
 * Function to shim `Promise.prototype.call`
 */

// Modules
var shimmer = require('shimmer');

// Exports

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Patch `call` method to run callbacks in current CLS context.
 *
 * @param {Function} Promise - Bluebird Promise constructor to patch
 * @param {Object} ns - CLS namespace to bind callbacks to
 * @returns {undefined}
 */
module.exports = function(Promise, ns) {
	// Patch method
	shimmer.wrap(Promise.prototype, 'call', function(callOriginal) {
		return function() {
			// Temporarily wrap `this._then` to bind the object method to current CLS context
			// (`this.call()` will call `this._then()` synchronously)
			var _thenOriginal = this._then,
				ownProperty = hasOwnProperty.call(this, '_then');

			this._then = function() {
				// Unwrap `this._then`
				if (ownProperty) {
					this._then = _thenOriginal;
				} else {
					delete this._then;
				}

				// Bind function that will be called to call object method to CLS context
				arguments[0] = ns.bind(arguments[0]);

				// Run original `this._then` method
				return _thenOriginal.apply(this, arguments);
			};

			// Call original `call` method
			return callOriginal.apply(this, arguments);
		};
	});
};
