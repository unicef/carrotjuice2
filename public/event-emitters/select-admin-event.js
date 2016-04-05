/**
 * When the user selects and administrative region in a country (polygon on the map).
 */

var P = require('pjs').P;

var SelectAdminEvent = P({
  key: 'SelectAdminEvent',
  init: function(selected_admins) {
    this.selected_admins = selected_admins;
  }
});

module.exports = SelectAdminEvent;
