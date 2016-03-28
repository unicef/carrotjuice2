/**
 * Which date / date-range the user has selected.
 */

var P = require('pjs').P;

var EventEmitter = require('../event-emitters/event-emitter-base.js');
var SelectDateEvent = require('../event-emitters/select-date-event.js');

var SelectedDate = P({
  init: function(weather_data_store) {
    // `current_day` is a Date.
    this.emitter = new EventEmitter([SelectDateEvent]);
    this.current_day = null;
    this.date_bar_visible = true;

    weather_data_store.initial_load_promise.then((function() {
      this.set_date(weather_data_store.last_date);
    }).bind(this));
  },

  set_date: function(date) {
    console.log('Setting date to', date);
    this.current_day = date;
    this.emitter.emit(new SelectDateEvent(date));
  }
});

module.exports = SelectedDate;
