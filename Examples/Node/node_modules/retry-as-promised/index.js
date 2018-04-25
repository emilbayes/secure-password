var debug = require('debug')('retry-as-promised')
  , error = require('debug')('retry-as-promised:error')
  , Promise = require('bluebird');

module.exports = function retryAsPromised(callback, options) {
  if (!callback || !options) throw new Error('retry-as-promised must be passed a callback and a options set or a number');

  if (typeof options === 'number') {
    options = {max: options};
  }

  // Super cheap clone
  options = {
    $current:         options.$current || 1,
    max:              options.max,
    timeout:          options.timeout || undefined,
    match:            options.match || [],
    backoffBase:      options.backoffBase === undefined ? 100 : options.backoffBase,
    backoffExponent:  options.backoffExponent || 1.1,
    report:           options.report || null,
    name:             options.name || callback.name || 'unknown'
  };

  // Massage match option into array so we can blindly treat it as such later
  if (!Array.isArray(options.match)) options.match = [options.match];
  
  if(options.report) options.report('Trying ' + options.name + ' #' + options.$current + ' at ' + new Date().toLocaleTimeString(), options);

  return new Promise(function (resolve, reject) {
    var timeout, backoffTimeout;

    if (options.timeout) {
      timeout = setTimeout(function () {
        if (backoffTimeout) clearTimeout(backoffTimeout);
        reject(Promise.TimeoutError( options.name + ' timed out'));
      }, options.timeout);
    }

    Promise.resolve(callback({ current: options.$current })).then(resolve).tap(function () {
      if (timeout) clearTimeout(timeout);
      if (backoffTimeout) clearTimeout(backoffTimeout);
    }).catch(function (err) {
      if (timeout) clearTimeout(timeout);
      if (backoffTimeout) clearTimeout(backoffTimeout);

      error(err && err.toString() || err);
      if (options.report) options.report('Try ' + options.name + ' #' + options.$current + ' failed: ' + err.toString(), options, err);

      // Should not retry if max has been reached
      var shouldRetry = options.$current < options.max;

      if (shouldRetry && options.match.length && err) {
        // If match is defined we should fail if it is not met
        shouldRetry = options.match.reduce(function (shouldRetry, match) {
          if (shouldRetry) return shouldRetry;

          if (match === err.toString() ||
              match === err.message ||
              (typeof match === "function" && err instanceof match) ||
              (match instanceof RegExp && (match.test(err.message) || match.test(err.toString()) ))
          ) {
            shouldRetry = true;
          }
          return shouldRetry;
        }, false);
      }

      if (!shouldRetry) return reject(err);

      var retryDelay = Math.pow(options.backoffBase, Math.pow(options.backoffExponent, (options.$current - 1)));

      // Do some accounting
      options.$current++;
      debug('Retrying '+ options.name + ' (%s)', options.$current);
      if (retryDelay) {
        // Use backoff function to ease retry rate
        debug('Delaying retry of ' + options.name + ' by %s', retryDelay);
        if(options.report) options.report('Delaying retry of ' + options.name + ' by ' + retryDelay, options);
        backoffTimeout = setTimeout(function() {
          retryAsPromised(callback, options).then(resolve).catch(reject);
        }, retryDelay);
      } else {
        retryAsPromised(callback, options).then(resolve).catch(reject);
      }

    });
  });
};
