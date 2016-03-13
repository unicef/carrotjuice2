/**
 * Model for handling errors
 */

var P = require('pjs').P;

var Error = P({
  init: function(cls, text, data) {
    this.cls = cls;
    this.text = text;
    this.data = data;
  }
});

var ErrorHandler = P({
  init: function(on_update) {
    this.active_errors = [];
    this.on_update = on_update;
  },

  error: function(cls, text, data) {
    console.error("Error[" + cls + "]: " + text, data);
    this.active_errors.push(new Error(cls, text, data));
    this.on_update();
  },

  get_active_errors: function() {
    return this.active_errors;
  },

  dismiss_all: function() {
    this.active_errors = [];
    this.on_update();
  }
});

module.exports = ErrorHandler;
