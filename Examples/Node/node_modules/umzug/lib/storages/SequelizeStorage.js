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

var _Storage2 = require('./Storage');

var _Storage3 = _interopRequireDefault(_Storage2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class SequelizeStorage
 */
var SequelizeStorage = function (_Storage) {
  (0, _inherits3.default)(SequelizeStorage, _Storage);

  /**
   * Constructs Sequelize based storage.
   *
   * Stores migration in a database table using Sequelize. One of "sequelize" or
   * "model" storage option is required.
   *
   * If "sequelize" option is supplied will create a model named "SequelizeMeta"
   * with timestamps and an attribute "name" for storing migrations. The model
   * name, table name, and column name are customizable with options.
   *
   * If "model" option is supplied will use existing model for storing
   * migrations. The model must have an attribute "name", which can be
   * customized.
   *
   * If the table does not exist it will be created automatically.
   *
   * @param {Object} [options]
   * @param {Object} [options.]
   * @param {Object} [options.sequelize] - configured instance of Sequelize.
   * @param {Object} [options.model] - Sequelize model - must have column name
   * matching "columnName" option.
   * @param {String} [options.modelName='SequelizeMeta'] - name of the model
   * to create if "model" option is not supplied.
   * @param {String} [options.tableName=modelName] - name of the table to create
   * if "model" option is not supplied.
   * @param {String} [options.schema=schema] - name of the schema to create
   * the table under, defaults to undefined.
   * @param {String} [options.columnName='name'] - name of the table column
   * holding migration name.
   * @param {String} [options.columnType=Sequelize.STRING] - type of the column.
   * For utf8mb4 charsets under InnoDB, you may need to set this <= 190.
   * @param {Boolean} [options.timestamps=false] - option to add timestamps to the model table
   */
  function SequelizeStorage() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        sequelize = _ref.sequelize,
        model = _ref.model,
        _ref$modelName = _ref.modelName,
        modelName = _ref$modelName === undefined ? 'SequelizeMeta' : _ref$modelName,
        tableName = _ref.tableName,
        schema = _ref.schema,
        _ref$columnName = _ref.columnName,
        columnName = _ref$columnName === undefined ? 'name' : _ref$columnName,
        columnType = _ref.columnType,
        _ref$timestamps = _ref.timestamps,
        timestamps = _ref$timestamps === undefined ? false : _ref$timestamps;

    (0, _classCallCheck3.default)(this, SequelizeStorage);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SequelizeStorage.__proto__ || (0, _getPrototypeOf2.default)(SequelizeStorage)).call(this));

    if (!model && !sequelize) {
      throw new Error('One of "sequelize" or "model" storage option is required');
    }

    _this.sequelize = sequelize || model.sequelize;

    var Sequelize = _this.sequelize.constructor;

    _this.columnType = columnType || Sequelize.STRING;
    _this.columnName = columnName;
    _this.timestamps = timestamps;
    _this.modelName = modelName;
    _this.tableName = tableName;
    _this.schema = schema;
    _this.model = model || _this.getModel();
    return _this;
  }

  (0, _createClass3.default)(SequelizeStorage, [{
    key: 'getModel',
    value: function getModel() {
      if (this.sequelize.isDefined(this.modelName)) {
        return this.sequelize.model(this.modelName);
      }

      return this.sequelize.define(this.modelName, {
        [this.columnName]: {
          type: this.columnType,
          allowNull: false,
          unique: true,
          primaryKey: true,
          autoIncrement: false
        }
      }, {
        tableName: this.tableName,
        schema: this.schema,
        timestamps: this.timestamps,
        charset: 'utf8',
        collate: 'utf8_unicode_ci'
      });
    }

    /**
     * Logs migration to be considered as executed.
     *
     * @param {String} migrationName - Name of the migration to be logged.
     * @returns {Promise}
     */

  }, {
    key: 'logMigration',
    value: function logMigration(migrationName) {
      var self = this;

      return this._model().sync().then(function (Model) {
        var migration = {};
        migration[self.columnName] = migrationName;
        return Model.create(migration);
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
      var self = this;
      var sequelize = this.sequelize;
      var sequelizeVersion = sequelize.modelManager ? 2 : 1;

      return this._model().sync().then(function (Model) {
        var where = {};
        where[self.columnName] = migrationName;

        if (sequelizeVersion > 1) {
          // This is an ugly hack to find out which function signature we have to use.
          where = { where: where };
        }

        return Model.destroy(where);
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
      var self = this;

      return this._model().sync().then(function (Model) {
        return Model.findAll({ order: [[self.columnName, 'ASC']] });
      }).then(function (migrations) {
        return migrations.map(function (migration) {
          return migration[self.columnName];
        });
      });
    }

    /**
     * Gets Sequelize model used as a storage.
     *
     * @returns {Sequelize.Model}
     * @private
     */

  }, {
    key: '_model',
    value: function _model() {
      return this.model;
    }
  }]);
  return SequelizeStorage;
}(_Storage3.default);

exports.default = SequelizeStorage;