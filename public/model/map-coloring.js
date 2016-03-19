/**
 * Model for map colors. Combines other models (selected date, etc.) and data stores.
 *
 * TODO(jetpack): rename to reflect expanded scope (w/ epi and mobility data,
 * this isn't just about colors).
 */

var P = require('pjs').P;
var Q = require('q');

var MapColoring = P({
  init: function(data_layer,
                 selected_admins,
                 selected_date,
                 selected_countries,
                 admin_details,
                 weather_data_store,
                 econ_data_store,
                 epi_data_store,
                 mobility_data_store) {
    this.data_layer = data_layer;
    this.selected_admins = selected_admins;
    this.selected_countries = selected_countries;
    this.selected_date = selected_date;
    this.data_stores_for_base_layer = {
      weather: weather_data_store,
      oviposition: weather_data_store.fake_oviposition_model(),
      population_density: admin_details,
      socioeconomic: econ_data_store
    };
    this.epi_data_store = epi_data_store;
    this.mobility_data_store = mobility_data_store;
    this.initial_load_promise = Q.all([
      weather_data_store.initial_load_promise,
      admin_details.initial_load_promise,
      econ_data_store.initial_load_promise,
      epi_data_store.initial_load_promise,
      mobility_data_store.initial_load_promise]);
  },

  active_base_layer_data_store: function() {
    return this.data_stores_for_base_layer[this.data_layer.base_layer];
  },

  // TODO(jetpack): is there a principled way to implement interfaces w/ P.js? e.g. have weather,
  // oviposition, and admin_details implement a "admin_color_layer" interface or something.
  active_base_layer_coloring_data: function() {
    return this.active_base_layer_data_store().admin_color_for_date(
      this.selected_date.current_day.toISOString());
  },

  base_layer_opacity: function() {
    return this.data_layer.base_opacity;
  },

  /**
   * Returns a map from overlay layer name to data for that layer. The type of data varies for each
   * overlay layer.
   *
   * For the 'epi' layer, the data type is an array of epi data objects (one per selected country)
   * each with the form:
   * {start_time: <Date>, end_time: <Date>,
   *  admin_epi_data: {'br-1': {dengue: 100, zika: 110},
   *                   'br-2': {dengue: 200, zika: 220}}}
   *
   * For the 'mobility' layer, the data type is a mapping from origin admin code to destination
   * admin code to count:
   * {'br-1': {'br-2': 1000, 'br-3': 2000},
   *  'br-2': {'br-1': 100, 'br-3': 10}}
   * The origin admins are the selected admins.
   */
  active_overlay_data: function() {
    var layer_name_to_data = {};
    var epi_data_store = this.epi_data_store;
    var selected_countries = this.selected_countries.get_selected_countries();
    var selected_admins = this.selected_admins.get_admin_codes();
    var selected_date = this.selected_date.current_day;
    this.data_layer.get_active_overlay_layers().forEach((function(overlay_name) {
      switch (overlay_name) {
        case 'epi':
          layer_name_to_data.epi = epi_data_store.get_best_recent_epi_data(selected_countries,
                                                                           selected_date);
          break;
        case 'mobility':
          layer_name_to_data.mobility = this.mobility_data_store.get_egress_records(selected_admins,
                                                                                    selected_date);
          break;
        default:
          console.error('BUG! Unknown overlay: ' + overlay_name);
      }
    }).bind(this));
    return layer_name_to_data;
  },

  case_data_to_severity: function(case_data) {
    return this.epi_data_store.case_data_to_severity(case_data);
  },

  case_data_to_display_strings: function(case_data) {
    return this.epi_data_store.case_data_to_display_strings(case_data);
  }
});

module.exports = MapColoring;
