'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _helper = require('./helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class Migration
 */
module.exports = function () {
  /**
   * Wrapper function for migration methods.
   *
   * @callback Migration~wrap
   * @param {function} - Migration method to be wrapped.
   * @return {*|Promise}
   */

  /**
   * Constructs Migration.
   *
   * @param {String} path - Path of the migration file.
   * @param {Object} options
   * @param {String} options.upName - Name of the method `up` in migration
   * module.
   * @param {String} options.downName - Name of the method `down` in migration
   * module.
   * @param {Object} options.migrations
   * @param {Migration~wrap} options.migrations.wrap - Wrapper function for
   * migration methods.
   * @param {Migration~customResolver} [options.migrations.customResolver] - A
   * function that specifies how to get a migration object from a path. This
   * should return an object of the form { up: Function, down: Function }.
   * Without this defined, a regular javascript import will be performed.
   * @constructs Migration
   */
  function Migration(path, options) {
    (0, _classCallCheck3.default)(this, Migration);

    this.path = _path3.default.resolve(path);
    this.file = _path3.default.basename(this.path);
    this.options = options;
  }

  /**
   * Tries to require migration module. CoffeeScript support requires
   * 'coffee-script' to be installed.
   * To require other file types, like TypeScript or raw sql files, a
   * custom resolver can be used.
   *
   * @returns {Promise.<Object>} Required migration module
   */


  (0, _createClass3.default)(Migration, [{
    key: 'migration',
    value: function migration() {
      if (typeof this.options.migrations.customResolver === 'function') {
        return this.options.migrations.customResolver(this.path);
      }
      if (this.path.match(/\.coffee$/)) {
        // 1.7.x compiler registration
        _helper2.default.resolve('coffee-script/register') ||

        // Prior to 1.7.x compiler registration
        _helper2.default.resolve('coffee-script') ||
        /* jshint expr: true */
        function () {
          console.error('You have to add "coffee-script" to your package.json.');
          process.exit(1);
        }();
      }

      return require(this.path);
    }

    /**
     * Executes method `up` of migration.
     *
     * @returns {Promise}
     */

  }, {
    key: 'up',
    value: function up() {
      return this._exec(this.options.upName, [].slice.apply(arguments));
    }

    /**
     * Executes method `down` of migration.
     *
     * @returns {Promise}
     */

  }, {
    key: 'down',
    value: function down() {
      return this._exec(this.options.downName, [].slice.apply(arguments));
    }

    /**
     * Check if migration file name is starting with needle.
     * @param {String} needle - The beginning of the file name.
     * @returns {boolean}
     */

  }, {
    key: 'testFileName',
    value: function testFileName(needle) {
      return this.file.indexOf(needle) === 0;
    }

    /**
     * Executes a given method of migration with given arguments.
     *
     * @param {String} method - Name of the method to be called.
     * @param {*} args - Arguments to be used when called the method.
     * @returns {Promise}
     * @private
     */

  }, {
    key: '_exec',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(method, args) {
        var migration, fun, wrappedFun;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.migration();

              case 2:
                migration = _context.sent;
                fun = migration[method];

                if (migration.default) {
                  fun = migration.default[method] || migration[method];
                }

                if (fun) {
                  _context.next = 7;
                  break;
                }

                throw new Error('Could not find migration method: ' + method);

              case 7:
                wrappedFun = this.options.migrations.wrap(fun);
                _context.next = 10;
                return wrappedFun.apply(migration, args);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _exec(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return _exec;
    }()
  }]);
  return Migration;
}();