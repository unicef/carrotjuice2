/**
 * Model for map colors. Combines other models (selected date, etc.) and data stores.
 */

var P = require('pjs').P;
var Q = require('q');

var MapColoring = P({
  init: function(init_dict) {
    this.data_layer = init_dict.data_layer;
    this.selected_date = init_dict.selected_date;
    this.data_stores = {
      weather: init_dict.weather_data_store,
      oviposition: init_dict.weather_data_store.fake_oviposition_model()
    };
    this.initial_load_promise = Q.all([init_dict.weather_data_store.initial_load_promise]);
  },

  active_data_store: function() {
    return this.data_stores[this.data_layer.base_layer];
  },

  active_data: function() {
    return this.active_data_store().region_color_for_date(
      this.selected_date.current_day.toISOString());
  }
});

module.exports = MapColoring;
