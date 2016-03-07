/**
 * Which regions the user has selected.
 */

var P = require('pjs').P;

var SelectedRegions = P({
  init: function(onUpdate) {
    this.regions = {};
    this.onUpdate = onUpdate;  // typically, view re-rendering callback
  },

  toggle_region: function(region_code) {
    if (this.regions[region_code] === undefined) {
      this.regions[region_code] = true;
    } else {
      delete this.regions[region_code];
    }
    this.onUpdate();
  },

  get_selected_regions: function() {
    return _.keys(this.regions);
  }

});

module.exports = SelectedRegions;
