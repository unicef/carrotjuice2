var assert = require('assert');
var ErrorHandler = require('../../model/error-handler.js');

describe('model/error-handler', function() {
  it('write, read, and delete', function() {
    var update_call_count = 0;
    var on_update = function() {
      update_call_count++;
    };

    var model = new ErrorHandler(on_update);

    // initial state is correct
    assert.strictEqual(model.get_active_errors().length, 0);
    assert.strictEqual(update_call_count, 0);

    // post-write state is correct
    model.error("ErrorCls", "threw an error!");
    assert.strictEqual(update_call_count, 1);
    assert.strictEqual(model.get_active_errors().length, 1);
    assert.strictEqual(model.get_active_errors()[0].cls, "ErrorCls");
    assert.strictEqual(model.get_active_errors()[0].text, "threw an error!");

    // post-delete state is correct
    model.dismiss_all();
    assert.strictEqual(update_call_count, 2);
    assert.strictEqual(model.get_active_errors().length, 0);
  });
});
