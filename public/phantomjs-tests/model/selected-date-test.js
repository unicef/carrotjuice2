var assert = require('assert');
var SelectedDate = require('../../model/selected-date.js');
var SelectionEvents = require('../../event-emitters/selection-events.js');
var Q = require('q');

describe('model/selected-date', function() {
  it('initializes current day', function() {
    var update_call_count = 0;
    var onUpdate = function() {
      update_call_count++;
    };
    var selection_ee = new SelectionEvents.SelectionEventEmitter();
    selection_ee.add_listener(SelectionEvents.DateSelectEvent, onUpdate);

    var deferred = Q.defer();
    var model = new SelectedDate(selection_ee, {
      initial_load_promise: deferred.promise,
      last_date: 'test last date'
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
