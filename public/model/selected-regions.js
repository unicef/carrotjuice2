/**
 * Which regions the user has selected.
 */

var P = require('pjs').P;

var SelectedRegions = P({
  init: function(onUpdate) {
    // `region_codes` is a map from region code to callbacks. The callbacks are
    // called when the region is unselected.
    this.region_codes = {};
    this.onUpdate = onUpdate;  // typically, view re-rendering callback
  },

  // Note: `on_unselect` is only used when `region_code` is toggled on.
  toggle_region: function(region_code, on_unselect) {
    if (this.is_region_selected(region_code)) {
      var cb = this.region_codes[region_code];
      delete this.region_codes[region_code];
      cb();
    } else {
      this.region_codes[region_code] = on_unselect || _.noop;
    }
    this.onUpdate();
  },

  select_region: function(region_code, on_unselect) {
    if (this.is_region_selected(region_code)) {
      console.log('Region', region_code, 'already selected, not doing anything.');
      return;
    }
    _.forOwn(this.region_codes, function(cb) { cb(); });
    this.region_codes = {};
    this.region_codes[region_code] = on_unselect || _.noop;
    this.onUpdate();
  },

  get_region_codes: function() {
    return _.keys(this.region_codes);
  },

  is_region_selected: function(region_code) {
    return _.has(this.region_codes, region_code);
  }

});

module.exports = SelectedRegions;
