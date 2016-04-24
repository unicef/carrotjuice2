/**
 * When the user clicks an administrative region on the map.
 */

var P = require('pjs').P;

var SelectAdminEvent = P({
  key: 'SelectAdminEvent',
  init: function(selected_admins) {
    this.selected_admins = selected_admins;
  }
});

module.exports = SelectAdminEvent;
