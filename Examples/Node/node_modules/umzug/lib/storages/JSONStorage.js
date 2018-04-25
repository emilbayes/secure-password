'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _Storage2 = require('./Storage');

var _Storage3 = _interopRequireDefault(_Storage2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class JSONStorage
 */
var JSONStorage = function (_Storage) {
  (0, _inherits3.default)(JSONStorage, _Storage);

  /**
   * Constructs JSON file storage.
   *
   * @param {Object} [options]
   * @param {String} [options.path='./umzug.json'] - Path to JSON file where
   * the log is stored. Defaults './umzug.json' relative to process' cwd.
   */
  function JSONStorage() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$path = _ref.path,
        path = _ref$path === undefined ? _path3.default.resolve(process.cwd(), 'umzug.json') : _ref$path;

    (0, _classCallCheck3.default)(this, JSONStorage);

    var _this = (0, _possibleConstructorReturn3.default)(this, (JSONStorage.__proto__ || (0, _getPrototypeOf2.default)(JSONStorage)).call(this));

    _this.path = path;
    return _this;
  }

  /**
   * Logs migration to be considered as executed.
   *
   * @param {String} migrationName - Name of the migration to be logged.
   * @returns {Promise}
   */


  (0, _createClass3.default)(JSONStorage, [{
    key: 'logMigration',
    value: function logMigration(migrationName) {
      var filePath = this.path;
      var readfile = _bluebird2.default.promisify(_fs2.default.readFile);
      var writefile = _bluebird2.default.promisify(_fs2.default.writeFile);

      return readfile(filePath).catch(function () {
        return '[]';
      }).then(function (content) {
        return JSON.parse(content);
      }).then(function (content) {
        content.push(migrationName);
        return writefile(filePath, (0, _stringify2.default)(content, null, '  '));
      });
    }

    /**
     * Unlogs migration to be considered as pending.
     *
     * @param {String} migrationName - Name of the migration to be unlogged.
     * @returns {Promise}
     */

  }, {
    key: 'unlogMigration',
    value: function unlogMigration(migrationName) {
      var filePath = this.path;
      var readfile = _bluebird2.default.promisify(_fs2.default.readFile);
      var writefile = _bluebird2.default.promisify(_fs2.default.writeFile);

      return readfile(filePath).catch(function () {
        return '[]';
      }).then(function (content) {
        return JSON.parse(content);
      }).then(function (content) {
        content = _lodash2.default.without(content, migrationName);
        return writefile(filePath, (0, _stringify2.default)(content, null, '  '));
      });
    }

    /**
     * Gets list of executed migrations.
     *
     * @returns {Promise.<String[]>}
     */

  }, {
    key: 'executed',
    value: function executed() {
      var filePath = this.path;
      var readfile = _bluebird2.default.promisify(_fs2.default.readFile);

      return readfile(filePath).catch(function () {
        return '[]';
      }).then(function (content) {
        return JSON.parse(content);
      });
    }
  }]);
  return JSONStorage;
}(_Storage3.default);

exports.default = JSONStorage;