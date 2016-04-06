/**
 * Defines selection-related events
 */

var P = require('pjs').P;
var EventEmitter = require('./event-emitter-base.js');

var DateSelectEvent = P({
  key: 'DateSelectEvent',
  init: function(selected_date) {
    this.selected_date = selected_date;
  }
});
var AdminSearchEvent = P({
  key: 'AdminSearchEvent',
  init: function(searched_admins) {
    this.searched_admins = searched_admins;
  }
});
var AdminSelectEvent = P({
  key: 'AdminSelectEvent',
  init: function(selected_admins) {
    this.selected_admins = selected_admins;
  }
});
var CountrySelectEvent = P({
  key: 'CountrySelectEvent',
  init: function(selected_country_codes) {
    this.selected_country_codes = selected_country_codes;
  }
});

var SelectionEventEmitter = P(EventEmitter, function(proto, event_emitter) {
  proto.init = function() {
    event_emitter.init([DateSelectEvent, AdminSearchEvent, AdminSelectEvent, CountrySelectEvent]);
  };
});

module.exports = {
  DateSelectEvent: DateSelectEvent,
  AdminSearchEvent: AdminSearchEvent,
  AdminSelectEvent: AdminSelectEvent,
  CountrySelectEvent: CountrySelectEvent,
  SelectionEventEmitter: SelectionEventEmitter
};
