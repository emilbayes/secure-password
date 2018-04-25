'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createFolder(folderName, folder, force) {
  if (force && _fs2.default.existsSync(folder) === true) {
    _index2.default.view.log('Deleting the ' + folderName + ' folder. (--force)');

    try {
      _fs2.default.readdirSync(folder).forEach(function (filename) {
        _fs2.default.unlinkSync(_path2.default.resolve(folder, filename));
      });
    } catch (e) {
      _index2.default.view.error(e);
    }

    try {
      _fs2.default.rmdirSync(folder);
      _index2.default.view.log('Successfully deleted the ' + folderName + ' folder.');
    } catch (e) {
      _index2.default.view.error(e);
    }
  }

  try {
    if (_fs2.default.existsSync(folder) === false) {
      _index2.default.asset.mkdirp(folder);
      _index2.default.view.log('Successfully created ' + folderName + ' folder at "' + folder + '".');
    } else {
      _index2.default.view.log(folderName + ' folder at "' + folder + '" already exists.');
    }
  } catch (e) {
    _index2.default.view.error(e);
  }
};

var init = {
  createMigrationsFolder: function createMigrationsFolder(force) {
    createFolder('migrations', _index2.default.path.getPath('migration'), force);
  },

  createSeedersFolder: function createSeedersFolder(force) {
    createFolder('seeders', _index2.default.path.getPath('seeder'), force);
  },

  createModelsFolder: function createModelsFolder(force) {
    createFolder('models', _index2.default.path.getModelsPath(), force);
  },

  createModelsIndexFile: function createModelsIndexFile(force) {
    var modelsPath = _index2.default.path.getModelsPath();
    var indexPath = _path2.default.resolve(modelsPath, _index2.default.path.addFileExtension('index'));

    if (!_index2.default.path.existsSync(modelsPath)) {
      _index2.default.view.log('Models folder not available.');
    } else if (_index2.default.path.existsSync(indexPath) && !force) {
      _index2.default.view.notifyAboutExistingFile(indexPath);
    } else {
      var relativeConfigPath = _path2.default.relative(_index2.default.path.getModelsPath(), _index2.default.config.getConfigFile());

      _index2.default.asset.write(indexPath, _index2.default.template.render('models/index.js', {
        configFile: '__dirname + \'/' + relativeConfigPath + '\''
      }, {
        beautify: false
      }));
    }
  }
};

module.exports = init;
module.exports.default = init;