'use strict';

var _resolve2 = require('resolve');

module.exports = {
  /**
   * Try to require module from file relative to process cwd or regular require.
   *
   * @param {string} packageName - Filename relative to process' cwd or package
   * name to be required.
   * @returns {*|undefined} Required module
   */
  resolve: function resolve(packageName) {
    var result = void 0;

    try {
      result = (0, _resolve2.sync)(packageName, { basedir: process.cwd() });
      result = require(result);
    } catch (e) {
      try {
        result = require(packageName);
      } catch (e) {
        result = undefined;
      }
    }

    return result;
  }
};