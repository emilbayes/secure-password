'use strict';

var _bluebird = require('bluebird');

var _yargs = require('../core/yargs');

var _migrator = require('../core/migrator');

var _helpers = require('../helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.builder = function (yargs) {
  return (0, _yargs._baseOptions)(yargs).option('to', {
    describe: 'Migration name to run migrations until',
    type: 'string'
  }).option('from', {
    describe: 'Migration name to start migrations from (excluding)',
    type: 'string'
  }).help().argv;
};
exports.handler = function () {
  var _ref = (0, _bluebird.coroutine)(function* (args) {
    var command = args._[0];

    // legacy, gulp used to do this
    yield _helpers2.default.config.init();

    switch (command) {
      case 'db:migrate':
        yield migrate(args);
        break;
      case 'db:migrate:schema:timestamps:add':
        yield migrateSchemaTimestampAdd(args);
        break;
      case 'db:migrate:status':
        yield migrationStatus(args);
        break;
    }

    process.exit(0);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

function migrate(args) {
  return (0, _migrator.getMigrator)('migration', args).then(function (migrator) {
    return (0, _migrator.ensureCurrentMetaSchema)(migrator).then(function () {
      return migrator.pending();
    }).then(function (migrations) {
      var options = {};
      if (migrations.length === 0) {
        _helpers2.default.view.log('No migrations were executed, database schema was already up to date.');
        process.exit(0);
      }
      if (args.to) {
        if (migrations.filter(function (migration) {
          return migration.file === args.to;
        }).length === 0) {
          _helpers2.default.view.log('No migrations were executed, database schema was already up to date.');
          process.exit(0);
        }
        options.to = args.to;
      }
      if (args.from) {
        if (migrations.map(function (migration) {
          return migration.file;
        }).lastIndexOf(args.from) === -1) {
          _helpers2.default.view.log('No migrations were executed, database schema was already up to date.');
          process.exit(0);
        }
        options.from = args.from;
      }
      return options;
    }).then(function (options) {
      return migrator.up(options);
    });
  }).catch(function (e) {
    return _helpers2.default.view.error(e);
  });
}

function migrationStatus(args) {
  return (0, _migrator.getMigrator)('migration', args).then(function (migrator) {
    return (0, _migrator.ensureCurrentMetaSchema)(migrator).then(function () {
      return migrator.executed();
    }).then(function (migrations) {
      _lodash2.default.forEach(migrations, function (migration) {
        _helpers2.default.view.log('up', migration.file);
      });
    }).then(function () {
      return migrator.pending();
    }).then(function (migrations) {
      _lodash2.default.forEach(migrations, function (migration) {
        _helpers2.default.view.log('down', migration.file);
      });
    });
  }).catch(function (e) {
    return _helpers2.default.view.error(e);
  });
}

function migrateSchemaTimestampAdd(args) {
  return (0, _migrator.getMigrator)('migration', args).then(function (migrator) {
    return (0, _migrator.addTimestampsToSchema)(migrator).then(function (items) {
      if (items) {
        _helpers2.default.view.log('Successfully added timestamps to MetaTable.');
      } else {
        _helpers2.default.view.log('MetaTable already has timestamps.');
      }
    });
  }).catch(function (e) {
    return _helpers2.default.view.error(e);
  });
}