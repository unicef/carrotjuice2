var assert = require('assert');
var SelectedDate = require('../../model/selected-date.js');
var Q = require('q');

describe('model/selected-date', function() {
  it('initializes current day', function() {
    var update_call_count = 0;
    var onUpdate = function() {
      update_call_count++;
    };

    var deferred = Q.defer();
    var model = SelectedDate(onUpdate, {
      initial_load_promise: deferred.promise,
      last_date: 'test last date'
    });

    // before resolution, should be uninitialized
    assert.equal(update_call_count, 0);
    assert.equal(model.current_day, 'loading');

    // after resolution, as expected. use a delay so that we're
    // sure the promise is resolved.
    deferred.resolve();
    return Q.delay(1).then(function() {
      assert.equal(update_call_count, 1);
      assert.equal(model.current_day, 'test last date');
    });
  });
});
