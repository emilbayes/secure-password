'use strict';

var _SequelizeStorage = require('./SequelizeStorage');

var _SequelizeStorage2 = _interopRequireDefault(_SequelizeStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _SequelizeStorage2.default;

console.warn('Deprecated: SequelizeStorage\'s filename has changed!', 'Use \'umzug/lib/storages/SequelizeStorage\' instead of \'umzug/lib/storages/sequelize\'', 'For more information: https://github.com/sequelize/umzug/pull/139');