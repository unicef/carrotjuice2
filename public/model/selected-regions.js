/**
 * Which regions the user has selected.
 */

var P = require('pjs').P;

var SelectedRegions = P({
  init: function(onUpdate) {
    this.onUpdate = onUpdate;
    // `selected_region_codes` is a map from region code to callbacks. The
    // callbacks are called when the region is unselected.
    this.selected_region_codes = {};
    this.hovered_region_code = null;
  },

  // Note: `on_unselect` is only used when `region_code` is toggled on.
  toggle_region: function(region_code, on_unselect) {
    if (this.is_region_selected(region_code)) {
      var cb = this.selected_region_codes[region_code];
      delete this.selected_region_codes[region_code];
      cb();
    } else {
      this.selected_region_codes[region_code] = on_unselect || _.noop;
    }
    this.onUpdate();
  },

  set_region_hovered: function(region_code) {
    this.hovered_region_code = region_code;
  },

  unset_region_hovered: function(region_code) {
    if (this.hovered_region_code === region_code) {
      this.hovered_region_code = null;
    }
  },

  select_region: function(region_code, on_unselect) {
    if (this.is_region_selected(region_code)) {
      console.log('Region', region_code, 'already selected, not doing anything.');
      return;
    }

    // We only call the previously selected regions' on_unselect callbacks after
    // updating `selected_region_codes`. This is so that when the callbacks run,
    // `selected_region_codes` accurately reflects what is now selected.
    var unselect_cbs = _.values(this.selected_region_codes);
    this.selected_region_codes = {};
    this.selected_region_codes[region_code] = on_unselect || _.noop;
    unselect_cbs.forEach(function(cb) { cb(); });

    this.onUpdate();
  },

  get_region_codes: function() {
    return _.keys(this.selected_region_codes);
  },

  is_region_selected: function(region_code) {
    return _.has(this.selected_region_codes, region_code);
  },

  get_border_weight: function(region_code) {
    if (this.is_region_selected(region_code)) {
      return 5;
    } else if (this.hovered_region_code === region_code) {
      return 3;
    } else {
      return 1;
    }
  }
});

module.exports = SelectedRegions;
