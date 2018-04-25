// --------------------
// is-bluebird module
// --------------------

// exports

/**
 * Identifies whether input is a bluebird promise.
 * @param {*} promise - Input to be tested
 * @returns {boolean} - true if is a bluebird promise, false if not
 */
var isBluebird = function(promise) {
    return isObject(promise) && isBluebird.ctor(promise.constructor);
};

/**
 * Identifies whether input is a bluebird promise constructor.
 * @param {*} Promise - Input to be tested
 * @returns {boolean} - true if is bluebird promise constructor, false if not
 */
isBluebird.ctor = function(Promise) {
    return typeof Promise == 'function' && !!Promise.prototype && typeof Promise.prototype._addCallbacks == 'function';
};

/**
 * Identifies whether input is a bluebird v2 promise.
 * @param {*} promise - Input to be tested
 * @returns {boolean} - true if is a bluebird v2 promise, false if not
 */
isBluebird.v2 = function(promise) {
    return isObject(promise) && isBluebird.v2.ctor(promise.constructor);
};

/**
 * Identifies whether input is bluebird v2 promise constructor.
 * @alias isBluebird.ctor.v2
 *
 * @param {*} promise - Input to be tested
 * @returns {boolean} - true if is a bluebird v2 promise, false if not
 */
isBluebird.v2.ctor = function(Promise) {
    return isBluebird.ctor(Promise) && Promise.prototype._addCallbacks.length == 6;
};

isBluebird.ctor.v2 = isBluebird.v2.ctor;

/**
 * Identifies whether input is a bluebird v3 promise.
 * @param {*} promise - Input to be tested
 * @returns {boolean} - true if is a bluebird v3 promise, false if not
 */
isBluebird.v3 = function(promise) {
    return isObject(promise) && isBluebird.v3.ctor(promise.constructor);
};

/**
 * Identifies whether input is bluebird v3 promise constructor.
 * @alias isBluebird.ctor.v3
 *
 * @param {*} promise - Input to be tested
 * @returns {boolean} - true if is a bluebird v3 promise, false if not
 */
isBluebird.v3.ctor = function(Promise) {
    return isBluebird.ctor(Promise) && Promise.prototype._addCallbacks.length == 5;
};

isBluebird.ctor.v3 = isBluebird.v3.ctor;

/**
 * Check if input is an object.
 * @param {*} obj - Input to be tested
 * @returns {boolean} - true if is an object, false if not
 */
function isObject(obj) {
    return !!obj && typeof obj == 'object';
}

// export isBluebird
module.exports = isBluebird;
