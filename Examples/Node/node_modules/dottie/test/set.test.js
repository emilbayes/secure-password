var expect = require("expect.js")
  , dottie = require('../dottie');

describe("dottie.set", function () {
  var data = {
    'foo': {
      'bar': 'baa'
    }
  };

  it("should set nested values on existing structure", function () {
    dottie.set(data, 'foo.bar', 'baz');
    expect(data.foo.bar).to.equal('baz');
  });

  it("should create nested structure if not existing", function () {
    dottie.set(data, 'level1.level2', 'foo');
    expect(data.level1.level2).to.equal('foo');
    expect(typeof data.level1).to.equal('object');
  });

  it("should handle setting a nested value on an undefined value (should convert undefined to object)", function () {
    var data = {
      'values': undefined
    };

    dottie.set(data, 'values.level1', 'foo');
    expect(data.values.level1).to.equal('foo');
  });

  it('should be able to set with an array path', function () {
    dottie.set(data, ['some.dot.containing', 'value'], 'razzamataz');
    expect(data['some.dot.containing'].value).to.equal('razzamataz');
  });

  it("should throw error when setting a nested value on an existing key with a non-object value", function() {
    expect(function () {
      dottie.set(data, 'foo.bar.baz', 'someValue');
    }).to.throwError();
  });

  it('should overwrite a nested non-object value on force: true', function () {
    dottie.set(data, 'foo.bar.baz', 'someValue', {
      force: true
    });
    expect(data.foo.bar.baz).to.equal('someValue');
  });
});