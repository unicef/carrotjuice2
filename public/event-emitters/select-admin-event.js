/**
 * Defines selection-related events
 */

var P = require('pjs').P;

var SelectAdminEvent = P({
  key: 'SelectDateEvent',
  init: function(selected_admins) {
    this.selected_admins = selected_admins;
  }
});

module.exports = SelectAdminEvent;
