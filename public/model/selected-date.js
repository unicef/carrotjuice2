/**
 * Which date / date-range the user has selected.
 */

var P = require('pjs').P;
var SelectionEvents = require('../event-emitters/selection-events.js');

var SelectedDate = P({
  init: function(selection_ee, weather_data_store) {
    // `current_day` is a Date.
    this.selection_ee = selection_ee;
    this.current_day = null;
    this.date_bar_visible = true;

    weather_data_store.initial_load_promise.then((function() {
      this.set_date(weather_data_store.last_date);
    }).bind(this));
  },

  set_date: function(date) {
    console.log('Setting date to', date);
    this.current_day = date;
    this.selection_ee.emit(new SelectionEvents.DateSelectEvent(date));
  }
});

module.exports = SelectedDate;
