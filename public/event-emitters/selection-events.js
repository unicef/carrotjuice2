/**
 * Defines selection-related events
 */

var P = require('pjs').P;
var EventEmitter = require('./event-emitter-base.js');

var DateSelectEvent = P({
  key: 'DateSelectEvent',
  init: function(date) {
    this.date = date;
  }
});
var AdminSelectEvent = P({key: 'AdminSelectEvent'});
var CountrySelectEvent = P({
  key: 'CountrySelectEvent',
  init: function(selected_country_codes) {
    this.selected_country_codes = selected_country_codes;
  }
});

var SelectionEventEmitter = P(EventEmitter, function(proto, event_emitter) {
  proto.init = function() {
    event_emitter.init([DateSelectEvent, AdminSelectEvent, CountrySelectEvent]);
  };
});

module.exports = {
  DateSelectEvent: DateSelectEvent,
  AdminSelectEvent: AdminSelectEvent,
  CountrySelectEvent: CountrySelectEvent,
  SelectionEventEmitter: SelectionEventEmitter
};
