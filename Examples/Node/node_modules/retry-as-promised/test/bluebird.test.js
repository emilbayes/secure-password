var chai = require('chai')
  , expect = chai.expect
  , Promise = require('bluebird')
  , moment = require('moment')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , retry = require('../');

chai.use(require('chai-as-promised'));
require('sinon-as-promised')(Promise);

describe('bluebird', function () {
  var count
    , soRejected
    , soResolved;

  beforeEach(function () {
    count = 0;
    soRejected = Math.random().toString();
    soResolved = Math.random().toString();
  });

  it('should reject immediately if max is 1 (using options)', function () {
    var callback = sinon.stub();
    callback.resolves(soResolved);
    callback.onCall(0).rejects(soRejected);
    return expect(retry(callback, {max: 1, backoffBase: 0})).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(callback.callCount).to.equal(1);
    });
  });

  it('should reject immediately if max is 1 (using integer)', function () {
    var callback = sinon.stub();
    callback.resolves(soResolved);
    callback.onCall(0).rejects(soRejected);
    return expect(retry(callback, 1)).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(callback.callCount).to.equal(1);
    });
  });

  it('should reject after all tries if still rejected', function () {
    var callback = sinon.stub();
    callback.rejects(soRejected);
    return expect(retry(callback, {max: 3, backoffBase: 0})).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(callback.firstCall.args).to.deep.equal([{ current: 1 }]);
      expect(callback.secondCall.args).to.deep.equal([{ current: 2 }]);
      expect(callback.thirdCall.args).to.deep.equal([{ current: 3 }]);
      expect(callback.callCount).to.equal(3);
    });
  });

  it('should resolve immediately if resolved on first try', function () {
    var callback = sinon.stub();
    callback.resolves(soResolved);
    callback.onCall(0).resolves(soResolved);
    return expect(retry(callback, {max: 10, backoffBase: 0})).to.eventually.equal(soResolved).then(function () {
      expect(callback.callCount).to.equal(1);
    });
  });

  it('should resolve if resolved before hitting max', function () {
    var callback = sinon.stub();
    callback.rejects(soRejected);
    callback.onCall(3).resolves(soResolved);
    return expect(retry(callback, {max: 10, backoffBase: 0})).to.eventually.equal(soResolved).then(function () {
      expect(callback.firstCall.args).to.deep.equal([{ current: 1 }]);
      expect(callback.secondCall.args).to.deep.equal([{ current: 2 }]);
      expect(callback.thirdCall.args).to.deep.equal([{ current: 3 }]);
      expect(callback.callCount).to.equal(4);
    });
  });

  describe('timeout', function () {
    it('should throw if reject on first attempt', function () {
      return expect(retry(function () {
        return Promise.delay(2000);
      }, {
        max: 1,
        backoffBase: 0,
        timeout: 1000
      })).to.eventually.be.rejectedWith(Promise.TimeoutError);
    });

    it('should throw if reject on last attempt', function () {
      return expect(retry(function () {
        count++;
        if (count === 3) {
          return Promise.delay(3500);
        }
        return Promise.reject();
      }, {
        max: 3,
        backoffBase: 0,
        timeout: 1500
      })).to.eventually.be.rejectedWith(Promise.TimeoutError).then(function () {
        expect(count).to.equal(3);
      });
    });
  });

  describe('match', function () {
    it('should continue retry while error is equal to match string', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      callback.onCall(3).resolves(soResolved);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: 'Error: ' + soRejected})).to.eventually.equal(soResolved).then(function () {
        expect(callback.callCount).to.equal(4);
      });
    });

    it('should reject immediately if error is not equal to match string', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: 'A custom error string'})).to.eventually.be.rejectedWith(soRejected).then(function () {
        expect(callback.callCount).to.equal(1);
      });
    });

    it('should continue retry while error is instanceof match', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      callback.onCall(4).resolves(soResolved);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: Error})).to.eventually.equal(soResolved).then(function () {
        expect(callback.callCount).to.equal(5);
      });
    });

    it('should reject immediately if error is not instanceof match', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: function foo(){}})).to.eventually.be.rejectedWith(Error).then(function () {
        expect(callback.callCount).to.equal(1);
      });
    });

    it('should continue retry while error is equal to match string in array', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      callback.onCall(4).resolves(soResolved);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: ['Error: ' + (soRejected + 1), 'Error: ' + soRejected]})).to.eventually.equal(soResolved).then(function () {
        expect(callback.callCount).to.equal(5);
      });
    });

    it('should reject immediately if error is not equal to match string in array', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: ['Error: ' + (soRejected + 1), 'Error: ' + (soRejected + 2)]})).to.eventually.be.rejectedWith(Error).then(function () {
        expect(callback.callCount).to.equal(1);
      });
    });

    it('should reject immediately if error is not instanceof match in array', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: ['Error: ' + (soRejected + 1), function foo(){}]})).to.eventually.be.rejectedWith(Error).then(function () {
        expect(callback.callCount).to.equal(1);
      });
    });

    it('should continue retry while error is instanceof match in array', function () {
      var callback = sinon.stub();
      callback.rejects(soRejected);
      callback.onCall(4).resolves(soResolved);
      return expect(retry(callback, {max: 15, backoffBase: 0, match: ['Error: ' + (soRejected + 1), Error]})).to.eventually.equal(soResolved).then(function () {
        expect(callback.callCount).to.equal(5);
      });
    });
  });

  describe('backoff', function () {
    it('should resolve after 5 retries and an eventual delay over 1800ms using default backoff', function () {
      var startTime = moment();
      var callback = sinon.stub();
      callback.rejects(soRejected);
      callback.onCall(5).resolves(soResolved);
      return expect(retry(callback, {max: 15})).to.eventually.equal(soResolved).then(function () {
        expect(callback.callCount).to.equal(6);
        expect(moment().diff(startTime)).to.be.above(1800);
        expect(moment().diff(startTime)).to.be.below(3400);
      });
    });

    it('should resolve after 1 retry and initial delay equal to the backoffBase', function() {
      var initialDelay = 100;
      var callback = sinon.stub();
      var startTime = moment();
      callback.onCall(0).rejects(soRejected);
      callback.onCall(1).resolves(soResolved);
      return expect(retry(callback, { max: 2, backoffBase: initialDelay, backoffExponent: 3 }))
        .to.eventually.equal(soResolved)
        .then(function() {
          expect(callback.callCount).to.equal(2);
          expect(moment().diff(startTime)).to.be.within(initialDelay, initialDelay + 50); // allow for some overhead
        });
    });

    it('should throw TimeoutError and cancel backoff delay if timeout is reached', function () {
      return expect(retry(function () {
        return Promise.delay(2000);
      }, {
        max: 15,
        timeout: 1000
      })).to.eventually.be.rejectedWith(Promise.TimeoutError);
    });
  });
});
