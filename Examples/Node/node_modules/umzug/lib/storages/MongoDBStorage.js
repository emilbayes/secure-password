'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _Storage2 = require('./Storage');

var _Storage3 = _interopRequireDefault(_Storage2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class JSONStorage
 */
var MongoDBStorage = function (_Storage) {
  (0, _inherits3.default)(MongoDBStorage, _Storage);

  /**
     * Constructs MongoDB collection storage.
     *
     * @param {Object} [options]
     * Required either connection and collectionName OR collection
     * @param {String} [options.connection] - a connection to target database established with MongoDB Driver
     * @param {String} [options.collectionName] - name of migration collection in MongoDB
     * @param {String} [options.collection] - reference to a MongoDB Driver collection
     */
  function MongoDBStorage(_ref) {
    var connection = _ref.connection,
        collectionName = _ref.collectionName,
        collection = _ref.collection;
    (0, _classCallCheck3.default)(this, MongoDBStorage);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MongoDBStorage.__proto__ || (0, _getPrototypeOf2.default)(MongoDBStorage)).call(this));

    _this.connection = connection;
    _this.collection = collection;
    _this.collectionName = collectionName || 'migrations';

    if (!_this.connection && !_this.collection) {
      throw new Error('MongoDB Connection or Collection required');
    }

    if (!_this.collection) {
      _this.collection = _this.connection.collection(_this.collectionName);
    }
    return _this;
  }

  /**
     * Logs migration to be considered as executed.
     *
     * @param {String} migrationName - Name of the migration to be logged.
     * @returns {Promise}
     */


  (0, _createClass3.default)(MongoDBStorage, [{
    key: 'logMigration',
    value: function logMigration(migrationName) {
      return this.collection.insertOne({ migrationName });
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
      return this.collection.removeOne({ migrationName });
    }

    /**
       * Gets list of executed migrations.
       *
       * @returns {Promise.<String[]>}
       */

  }, {
    key: 'executed',
    value: function executed() {
      return this.collection.find({}).sort({ migrationName: 1 }).toArray().then(function (records) {
        return _lodash2.default.map(records, 'migrationName');
      });
    }
  }]);
  return MongoDBStorage;
}(_Storage3.default);

exports.default = MongoDBStorage;