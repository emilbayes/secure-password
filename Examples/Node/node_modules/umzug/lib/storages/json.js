'use strict';

var _JSONStorage = require('./JSONStorage');

var _JSONStorage2 = _interopRequireDefault(_JSONStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _JSONStorage2.default;

console.warn('Deprecated: JSONStorage\'s filename has changed!', 'Use \'umzug/lib/storages/JSONStorage\' instead of \'umzug/lib/storages/json\'', 'For more information: https://github.com/sequelize/umzug/pull/139');