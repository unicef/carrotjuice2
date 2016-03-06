/**
 * Which date / date-range the user has selected.
 */

var P = require('pjs').P;

var DataLayer = P({
  init: function(onUpdate) {
    // NOTE: use the latest key from weather/etc. data
    this.current_day = '';
    this.date_bar_visible = true;
    this.onUpdate = onUpdate;  // typically, view re-rendering callback
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

module.exports = DataLayer;
