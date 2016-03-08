/**
 * Which regions the user has selected.
 */

var P = require('pjs').P;

var SelectedRegions = P({
  init: function(onUpdate) {
    this.region_codes = {};
    this.onUpdate = onUpdate;  // typically, view re-rendering callback
  },

  toggle_region: function(region_code) {
    if (this.region_codes[region_code] === undefined) {
      this.region_codes[region_code] = true;
    } else {
      delete this.region_codes[region_code];
    }
    this.onUpdate();
  },

  get_region_codes: function() {
    return _.keys(this.region_codes);
  }

});

module.exports = SelectedRegions;
