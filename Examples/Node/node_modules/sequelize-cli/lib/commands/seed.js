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
  return (0, _yargs._baseOptions)(yargs).help().argv;
};
exports.handler = function () {
  var _ref = (0, _bluebird.coroutine)(function* (args) {
    var command = args._[0];

    // legacy, gulp used to do this
    yield _helpers2.default.config.init();

    switch (command) {
      case 'db:seed:all':
        yield seedAll(args);
        break;

      case 'db:seed:undo:all':
        yield seedUndoAll(args);
        break;
    }

    process.exit(0);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

function seedAll(args) {
  return (0, _migrator.getMigrator)('seeder', args).then(function (migrator) {
    return migrator.pending().then(function (seeders) {
      if (seeders.length === 0) {
        _helpers2.default.view.log('No seeders found.');
        return;
      }

      return migrator.up({ migrations: _lodash2.default.chain(seeders).map('file').value() });
    });
  }).catch(function (e) {
    return _helpers2.default.view.error(e);
  });
}

function seedUndoAll(args) {
  return (0, _migrator.getMigrator)('seeder', args).then(function (migrator) {
    return (_helpers2.default.umzug.getStorage('seeder') === 'none' ? migrator.pending() : migrator.executed()).then(function (seeders) {
      if (seeders.length === 0) {
        _helpers2.default.view.log('No seeders found.');
        return;
      }

      return migrator.down({ migrations: _lodash2.default.chain(seeders).map('file').reverse().value() });
    });
  }).catch(function (e) {
    return _helpers2.default.view.error(e);
  });
}