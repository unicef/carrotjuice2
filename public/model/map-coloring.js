/**
 * Model for map colors. Combines other models (selected date, etc.) and data stores.
 *
 * TODO(jetpack): rename to reflect expanded scope (w/ epi and mobility data,
 * this isn't just about colors).
 */

var P = require('pjs').P;
var Q = require('q');

var MapColoring = P({
  init: function(init_dict) {
    this.data_layer = init_dict.data_layer;
    this.selected_date = init_dict.selected_date;
    this.data_stores_for_base_layer = {
      weather: init_dict.weather_data_store,
      oviposition: init_dict.weather_data_store.fake_oviposition_model()
    };
    this.epi_data_store = init_dict.epi_data_store;
    this.initial_load_promise = Q.all([init_dict.weather_data_store.initial_load_promise,
                                       this.epi_data_store.initial_load_promise]);
  },

  active_base_layer_data_store: function() {
    return this.data_stores_for_base_layer[this.data_layer.base_layer];
  },

  active_base_layer_coloring_data: function() {
    return this.active_base_layer_data_store().region_color_for_date(
      this.selected_date.current_day.toISOString());
  },

  active_overlay_data: function() {
    var layer_name_to_data = {};
    var epi_data_store = this.epi_data_store;
    this.data_layer.get_active_overlay_layers().forEach(function(overlay_name) {
      switch (overlay_name) {
        case 'epi':
          // TODO(jetpack): get data relevant for `selected_date` instead of latest data.
          layer_name_to_data.epi = epi_data_store.latest_epi_data_by_region();
          break;
        case 'mobility':
          console.error('Mobility overlay not yet supported!');
          break;
        default:
          console.error('BUG! Unknown overlay: ' + overlay_name);
      }
    });
    return layer_name_to_data;
  },

  epi_data_to_severity: function(epi_data) {
    return this.epi_data_store.epi_data_to_severity(epi_data);
  },

  epi_data_to_html_string: function(epi_data) {
    return this.epi_data_store.epi_data_to_html_string(epi_data);
  }
});

module.exports = MapColoring;
