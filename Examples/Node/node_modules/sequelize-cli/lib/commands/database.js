'use strict';

var _bluebird = require('bluebird');

var _yargs = require('../core/yargs');

var _migrator = require('../core/migrator');

var _helpers = require('../helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _lodash = require('lodash');

var _cliColor = require('cli-color');

var _cliColor2 = _interopRequireDefault(_cliColor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Sequelize = _helpers2.default.generic.getSequelize();

exports.builder = function (yargs) {
  return (0, _yargs._baseOptions)(yargs).help().argv;
};
exports.handler = function () {
  var _ref = (0, _bluebird.coroutine)(function* (args) {
    var command = args._[0];

    // legacy, gulp used to do this
    yield _helpers2.default.config.init();

    var sequelize = getDatabaseLessSequelize();
    var config = _helpers2.default.config.readConfig();

    switch (command) {
      case 'db:create':
        yield sequelize.query(`CREATE DATABASE ${sequelize.getQueryInterface().quoteIdentifier(config.database)}`, {
          type: sequelize.QueryTypes.RAW
        }).catch(function (e) {
          return _helpers2.default.view.error(e);
        });

        _helpers2.default.view.log('Database', _cliColor2.default.blueBright(config.database), 'created.');

        break;
      case 'db:drop':
        yield sequelize.query(`DROP DATABASE ${sequelize.getQueryInterface().quoteIdentifier(config.database)}`, {
          type: sequelize.QueryTypes.RAW
        }).catch(function (e) {
          return _helpers2.default.view.error(e);
        });

        _helpers2.default.view.log('Database', _cliColor2.default.blueBright(config.database), 'dropped.');

        break;
    }

    process.exit(0);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

function getDatabaseLessSequelize() {
  var config = null;

  try {
    config = _helpers2.default.config.readConfig();
  } catch (e) {
    _helpers2.default.view.error(e);
  }

  config = (0, _lodash.cloneDeep)(config);
  config = (0, _lodash.defaults)(config, { logging: _migrator.logMigrator });

  switch (config.dialect) {
    case 'postgres':
    case 'postgres-native':
      config.database = 'postgres';
      break;

    case 'mysql':
      delete config.database;
      break;

    case 'mssql':
      config.database = 'master';
      break;

    default:
      _helpers2.default.view.error(`Dialect ${config.dialect} does not support db:create / db:drop commands`);
  }

  try {
    return new Sequelize(config);
  } catch (e) {
    _helpers2.default.view.error(e);
  }
}