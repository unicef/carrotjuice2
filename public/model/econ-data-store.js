/**
 * Stores socioeconomic data.
 *
 * NOTE! This is just a sketch. Data is *not* fetched from the backend, but just hardcoded for now.
 * It's not clear we even need a separate data store - perhaps we can just store this with admin
 * data, if we don't expect it to change over time.
 */

var P = require('pjs').P;
var Q = require('q');

var EventEmitter = require('../event-emitters/event-emitter-base.js');
var GenericDataLoadedEvent = require('../event-emitters/generic-data-loaded-event.js');

var EconDataStore = P({
  init: function() {
    this.emitter = new EventEmitter([GenericDataLoadedEvent]);

    this.spending_by_admin = {};

    this.initial_load_promise = Q.delay(10).then((function() {
      this.spending_by_admin = require('./hardcoded-econ-data.js');
    }).bind(this))
      .catch(function(err) { console.error('Error getting socioeconomic data:', err); });
  }

});

module.exports = EconDataStore;
