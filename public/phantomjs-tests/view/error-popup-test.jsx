var $ = require('jquery');
var assert = require('assert');
var ErrorHandler = require('../../model/error-handler.js');
var ErrorPopup = require('../../view/error-popup.jsx');
var Q = require('q');
var React = require('react');  // required to be in scope post-JSX compilation
var ReactDOM = require('react-dom');

describe('view/error-popup', function() {
  it('basic functionality', function() {
    var element_to_update = null;
    var update_call_count = 0;
    var on_update = function() {
      update_call_count += 1;
      element_to_update.forceUpdate();
    };
    var error_handler_model = new ErrorHandler(on_update);

    return Q().then(function() {
      element_to_update = ReactDOM.render(
        <ErrorPopup error_handler={error_handler_model}/>,
        window.test_content_div
      );
    }).delay(1).then(function() {
      var element = $('div.error-popup-container');
      assert.strictEqual(element.length, 1, "didn't find popup container");
      assert.ok(!element.is(':visible'), "Element is hidden (no errors)");
      assert.strictEqual(update_call_count, 0);
      error_handler_model.error("TestCls", "test error");
      assert.strictEqual(update_call_count, 1);
    }).delay(1).then(function() {
      var element = $('div.error-popup-container');
      assert.strictEqual(element.length, 1, "didn't find popup container");
      assert.ok(element.is(':visible'), "Element is visible");

      var report_link = element.find('a:contains("report")');
      assert.ok(
        report_link.attr("href").match(/.*github.*issues/),
        "reporting link is okay"
      );

      var dismiss_link = element.find('a:contains("Dismiss")');
      assert.strictEqual(dismiss_link.length, 1, "dismiss link not found");
      console.log("dismissing ...");
      dismiss_link.trigger('click');
    });
  });
});
