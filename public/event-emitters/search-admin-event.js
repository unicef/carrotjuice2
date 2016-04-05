/**
 * When the user selects and administrative region in a country (polygon on the map).
 */

var _ = require('lodash');
var P = require('pjs').P;

var SearchAdminEvent = P({
  key: 'SearchAdminEvent',
  init: function(searched_admin_codes) {
    if (!_.isArray(searched_admin_codes)) {
      console.error("Bad argument to SearchAdminEvent", searched_admin_codes);
    }
    this.searched_admin_codes = searched_admin_codes;
  }
});

module.exports = SearchAdminEvent;
