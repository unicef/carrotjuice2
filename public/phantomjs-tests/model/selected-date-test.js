var assert = require('assert');
var Q = require('q');

var SelectedDate = require('../../model/selected-date.js');
var SelectDateEvent = require('../../event-emitters/select-date-event.js');

describe('model/selected-date', function() {
  it('initializes current day', function() {
    var update_call_count = 0;

    var deferred = Q.defer();
    var model = new SelectedDate({
      initial_load_promise: deferred.promise,
      last_date: 'test last date'
    });
    model.emitter.add_listener(SelectDateEvent, function() {
      update_call_count++;
    });

    // before resolution, should be uninitialized
    assert.strictEqual(update_call_count, 0);
    assert.strictEqual(model.current_day, null);

    // after resolution, as expected. use a delay so that we're
    // sure the promise is resolved.
    deferred.resolve();
    return Q.delay(1).then(function() {
      assert.strictEqual(update_call_count, 1);
      assert.strictEqual(model.current_day, 'test last date');
    });
  });
});
