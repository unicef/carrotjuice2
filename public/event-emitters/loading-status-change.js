/**
 * Defines selection-related events
 */

var P = require('pjs').P;

var LoadingStatusChange = P({
  key: 'LoadingStatusChange',
  init: function(is_initializing, inflight_requests, inflight_requests_change) {
    this.is_initializing = is_initializing;
    this.inflight_requests = inflight_requests;
    this.inflight_requests_change = inflight_requests_change;
  }
});

module.exports = LoadingStatusChange;
