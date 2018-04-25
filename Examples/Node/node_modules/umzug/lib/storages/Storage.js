'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class Storage
 */
var Storage = function () {
  function Storage() {
    (0, _classCallCheck3.default)(this, Storage);
  }

  (0, _createClass3.default)(Storage, [{
    key: 'logMigration',

    /**
     * Does nothing.
     *
     * @param {String} migrationName - Name of migration to be logged.
     * @returns {Promise}
     */
    value: function logMigration(migrationName) {
      return _bluebird2.default.resolve();
    }

    /**
     * Does nothing.
     *
     * @param {String} migrationName - Name of migration to unlog.
     * @returns {Promise}
     */

  }, {
    key: 'unlogMigration',
    value: function unlogMigration(migrationName) {
      return _bluebird2.default.resolve();
    }

    /**
     * Does nothing.
     *
     * @returns {Promise.<String[]>}
     */

  }, {
    key: 'executed',
    value: function executed() {
      return _bluebird2.default.resolve([]);
    }
  }]);
  return Storage;
}();

exports.default = Storage;