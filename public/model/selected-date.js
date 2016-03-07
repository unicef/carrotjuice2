/**
 * Which date / date-range the user has selected.
 */

var P = require('pjs').P;

var SelectedDate = P({
  init: function(onUpdate, weather_data_store) {
    // NOTE: use the latest key from weather/etc. data
    this.current_day = 'loading';
    this.date_bar_visible = true;
    this.onUpdate = onUpdate;  // typically, view re-rendering callback

    weather_data_store.initial_load_promise.then((function() {
      this.current_day = weather_data_store.last_date;
      this.onUpdate();
    }).bind(this));
  },

  set_date: function(date) {
    this.current_day = date;
    this.onUpdate();
  },

  toggle_date_bar: function() {
    this.date_bar_visible = !this.date_bar_visible;
    this.onUpdate();
  }
});

module.exports = SelectedDate;
