/**
 * When the user selects a country.
 */

var P = require('pjs').P;

var SelectCountryEvent = P({
  key: 'SelectCountryEvent',
  init: function(selected_country_codes) {
    this.selected_country_codes = selected_country_codes;
  }
});

module.exports = SelectCountryEvent;
