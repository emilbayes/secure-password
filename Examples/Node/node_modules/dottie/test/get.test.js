var expect = require("expect.js")
  , dottie = require('../dottie');

/* If people modify the array prototype Dottie should not be affected */
Array.prototype.getByName = function(name) {
  for (var i = 0, len = this.length; i < len; i++) {
    if (typeof this[i] != "object") continue;
    if (this[i].name === name) return this[i];
  }
};

Array.prototype.getByType = function(type) {
  var newvalues = [];
  for (var i = 0, len = this.length; i < len; i++) {
    if (typeof this[i] != "object") continue;
    if (this[i].type === type) newvalues.push(this[i]);
  }
  if (newvalues.length <= 0) newvalues = undefined;
  return newvalues;
};

describe("dottie.get", function () {
  var flags = {
    memoizePath: [false, true]
  };

  var data = {
    'foo': {
      'bar': 'baz'
    },
    'zoo': 'lander',
    'false': {
      'value': false
    },
    'null': {
      'value': null
    },
    'nullvalue': null,
    'nested.dot': {
      'key': 'value'
    }
  };

  Object.keys(flags).forEach(function (flag) {
    flags[flag].forEach(function (value) {
      describe(flag+': '+value, function () {
        beforeEach(function () {
          dottie[flag] = value;
        });

        it('should return undefined if value is undefined', function () {
          expect(dottie.get(undefined, 'foo')).to.equal(undefined);
          expect(dottie.get(undefined, 'foo')).to.equal(undefined);
        });

        it('should return undefined if key is undefined', function () {
          expect(dottie.get(data, undefined)).to.equal(undefined);
          expect(dottie.get(data, null)).to.equal(undefined);
          expect(dottie.get(data, undefined, 'default')).to.equal('default');
        });

        it("should get first-level values", function () {
          expect(dottie.get(data, 'zoo')).to.equal('lander');
          expect(dottie.get(data, 'zoo')).to.equal('lander');
        });

        it("should get nested-level values", function () {
          expect(dottie.get(data, 'foo.bar')).to.equal('baz');
        });

        it("should get nested-level values multiple times", function () {
          expect(dottie.get(data, 'foo.bar')).to.equal('baz');
          expect(dottie.get(data, 'foo.bar')).to.equal('baz');
          expect(dottie.get(data, 'foo.bar')).to.equal('baz');
          expect(dottie.get(data, 'foo.bar')).to.equal('baz');
        });

        it("should return undefined if not found", function () {
          expect(dottie.get(data, 'foo.zoo.lander')).to.equal(undefined);
        });

        it("should return false values properly", function () {
          expect(dottie.get(data, 'false.value')).to.equal(false);
        });

        it("should return the default value passed in if not found", function() {
          expect(dottie.get(data, 'foo.zoo.lander', 'novalue')).to.equal('novalue');
        });

        it("should return null of the value is null and not undefined", function() {
          expect(dottie.get(data, 'null.value')).to.equal(null);
        });

        it("should return undefined if accessing a child property of a null value", function () {
          expect(dottie.get(data, 'nullvalue.childProp')).to.equal(undefined);
          expect(dottie.get(data, 'null.value.childProp')).to.equal(undefined);
        });

        it("should return undefined if accessing a child property of a string value", function () {
          expect(dottie.get(data, 'foo.bar.baz.yapa')).to.equal(undefined);
        });

        it('should get nested values with keys that have dots', function () {
          var path = ['nested.dot', 'key'];

          expect(dottie.get(data, path)).to.equal('value');
          expect(path).to.eql(['nested.dot', 'key']);
        });
      });
    });
  });
});
