var expect = require("expect.js")
  , dottie = require('../dottie');

describe("dottie.find", function () {
  var data = {
    'foo': {
      'bar': 'baz'
    },
    'zoo': 'lander'
  };

  it("should get first-level values", function () {
    expect(dottie.find('zoo', data)).to.equal('lander');
  });

  it("should get nested-level values", function () {
    expect(dottie.find('foo.bar', data)).to.equal('baz');
  });
});