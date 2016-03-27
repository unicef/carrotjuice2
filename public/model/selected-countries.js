/**
 * Which countries the user has selected.
 */

var P = require('pjs').P;
var SelectionEvents = require('../event-emitters/selection-events.js');

var SelectedCountries = P({
  init: function(selection_ee, available_options) {
    this.selection_ee = selection_ee;
    this.selected_country_codes = {};
    this.available_options = available_options;
    // Start with all options selected.
    this.available_options.forEach((function(code) {
      this.selected_country_codes[code] = true;
    }).bind(this));
  },

  is_country_selected: function(country_code) {
    return _.has(this.selected_country_codes, country_code);
  },

  get_selected_countries: function() {
    return _.keys(this.selected_country_codes);
  },

  toggle_country: function(country_code) {
    if (this.is_country_selected(country_code)) {
      delete this.selected_country_codes[country_code];
    } else {
      this.selected_country_codes[country_code] = true;
    }
    console.log('new coutries:', this.selected_country_codes);
    this.selection_ee.emit(
      new SelectionEvents.CountrySelectEvent(this.get_selected_countries())
    );
  }
});

module.exports = SelectedCountries;
