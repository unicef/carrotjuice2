/**
 * Model for admin details. Combines other models (selected admins, etc.) and data stores.
 */

var _ = require('lodash');
var P = require('pjs').P;
var Q = require('q');
var d3 = require('d3');
var topojson = require('topojson');

var AdminDetails = P({
  // NOTE: Keep in sync with main.jsx
  init: function(on_update,
                 api_client,
                 selected_admins,
                 epi_data_store,
                 weather_data_store,
                 initial_countries_to_load) {
    this.on_update = on_update;
    this.selected_admins = selected_admins;
    this.epi_data_store = epi_data_store;
    this.weather_data_store = weather_data_store;
    // TODO(jetpack): maybe this should be a separate class, like weather_data_store.
    // `admin_data_by_code` is a map from admin code to admin data. Admin data has fields `name`,
    // `admin_code`, `geo_area_sqkm`, and possibly `population`.
    this.admin_data_by_code = {};
    // Map from country code to GeoJSON FeatureCollection. The features' properties include the
    // admin data fields.
    this.admin_feature_collection_by_country = {};
    var fetch_admin_data_promise = Q.all(
      initial_countries_to_load.map((function(country_code) {
        console.log('Fetching admins for', country_code);
        return api_client.fetch_admin_data(country_code)
          .then(this.process_admin_data.bind(this, country_code));
      }).bind(this)))
        .catch(function(err) { console.error(err); });

    this.initial_load_promise = Q.all([epi_data_store.initial_load_promise,
                                       weather_data_store.initial_load_promise,
                                       fetch_admin_data_promise]);
  },

  process_admin_data: function(country_code, data) {
    if (data.type !== 'Topology') {
      throw new Error('Bad JSON data');
    } else {
      this.admin_feature_collection_by_country[country_code] =
        topojson.feature(data, data.objects.collection);
      var admin_data_by_code = this.admin_data_by_code;
      data.objects.collection.geometries.forEach(function(obj) {
        // FWIW, `properties` also has `country_code` .
        admin_data_by_code[obj.properties.admin_code] =
          _.pick(obj.properties, ['name', 'admin_code', 'geo_area_sqkm', 'population']);
      });
    }
  },

  get_geojson_features: function(country_code) {
    return _.get(this.admin_feature_collection_by_country, [country_code, 'features']);
  },

  get_admin_properties: function(admin_code) {
    return this.admin_data_by_code[admin_code];
  },

  get_selected_admins_data: function() {
    var admin_data_by_code = this.admin_data_by_code;
    return this.selected_admins.get_admin_codes().map(function(admin_code) {
      return admin_data_by_code[admin_code];
    });
  },

  get_epi_data_display_strings: function(admin_code, date) {
    var epi_data = this.epi_data_store.get_recent_epi_data_for_admin(admin_code, date);
    if (epi_data) {
      return this.epi_data_store.case_data_to_display_strings(
        epi_data.admin_case_data[admin_code], epi_data.start_time, epi_data.end_time);
    }
  },

  // Used by MapColoring for the population density base layer. The raw function should only be
  // called once, as this data is static (and doesn't vary by date).
  admin_color_for_date_raw: function() {
    console.log('generating admin population density chloropleth - should only run once!');
    var density_to_color = d3.scale.log().domain([1, 1000])
        .range(['white', 'purple']).clamp(true);
    return _.mapValues(this.admin_data_by_code, function(admin_data) {
      var density = admin_data.population / admin_data.geo_area_sqkm;
      return density ? density_to_color(density) : 'white';
    });
  },

  // We use a constant function for the resolver so that we only ever call the raw function once,
  // regardless of the date argument.
  // TODO(jetpack): without the wrapper, we get error about this.admin_color_for_date_raw not being
  // a function. wat?
  admin_color_for_date: _.memoize(function() { return this.admin_color_for_date_raw(); },
                                  _.constant(true))

});

module.exports = AdminDetails;
