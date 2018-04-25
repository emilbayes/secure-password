var expect = require("expect.js")
  , dottie = require('../dottie');

describe("dottie.flatten", function () {
  it('should handle a basic nested structure without arrays', function () {
    var data = {
      'foo': {
        'bar': 'baa',
        'baz': {
          'foo': 'bar'
        }
      },
      'bar': 'baz'
    };

    expect(dottie.flatten(data)).to.eql({
      'foo.bar': 'baa',
      'foo.baz.foo': 'bar',
      'bar': 'baz'
    });
  });

  it('should be possible to define your own seperator', function () {
    var data = {
      'foo': {
        'bar': 'baa',
        'baz': {
          'foo': 'bar'
        }
      },
      'bar': 'baz'
    };

    expect(dottie.flatten(data, '_')).to.eql({
      'foo_bar': 'baa',
      'foo_baz_foo': 'bar',
      'bar': 'baz'
    });
  });
});