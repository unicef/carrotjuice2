/**
 * When the user searches for an administrative region, by name (via the search box).
 */

var P = require('pjs').P;

var SearchAdminEvent = P({
  key: 'SearchAdminEvent',
  init: function(searched_admin_codes) {
    this.searched_admin_codes = searched_admin_codes;
  }
});

module.exports = SearchAdminEvent;
