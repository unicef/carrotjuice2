/**
 * Represents whether the file is loading.
 */

var P = require('pjs').P;

var EventEmitter = require('../event-emitters/event-emitter-base.js');
var LoadingStatusChange = require('../event-emitters/loading-status-change.js');

var LoadingStatusModel = P({
  init: function() {
    this.emitter = new EventEmitter([LoadingStatusChange]);
    this.is_initializing = true;
    this.inflight_requests = 0;
  },

  set_initialized_topojson: function() {
    this.is_initializing = false;
    this.emitter.emit(new LoadingStatusChange(
      this.is_initializing, this.inflight_requests, 0
    ));
  },

  track_loading_promise: function(promise) {
    this.inflight_requests++;
    this.emitter.emit(new LoadingStatusChange(
      this.is_initializing, this.inflight_requests, 1
    ));

    // TODO(zora): handle failures better
    var finally_fcn = function() {
      this.inflight_requests--;
      this.emitter.emit(new LoadingStatusChange(
        this.is_initializing, this.inflight_requests, -1
      ));
    }.bind(this);
    promise.then(finally_fcn, finally_fcn);
  }
});

module.exports = LoadingStatusModel;
