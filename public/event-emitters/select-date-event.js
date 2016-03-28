/**
 * When the user selects a date.
 */

var P = require('pjs').P;

var SelectDateEvent = P({
  key: 'DateSelectEvent',
  init: function(selected_date) {
    this.selected_date = selected_date;
  }
});

module.exports = SelectDateEvent;
