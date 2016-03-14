/**
 * Model for admin details. Combines other models (selected admins, etc.) and data stores.
 */

var P = require('pjs').P;
var Q = require('q');
var topojson = require('topojson');

var AdminDetails = P({
  init: function(init_dict) {
    this.on_update = init_dict.on_update;
    this.selected_admins = init_dict.selected_admins;
    this.epi_data_store = init_dict.epi_data_store;
    this.weather_data_store = init_dict.weather_data_store;
    // TODO(jetpack): maybe this should be a separate class, like weather_data_store.
    // `admin_data_by_code` is a map from admin code to admin data. Admin
    // data has fields `name`, `admin_code`, and `geo_area_sqkm`.
    this.admin_data_by_code = {};
    // Map from country code to GeoJSON FeatureCollection. The features' properties include the
    // admin data fields.
    this.admin_feature_collection_by_country = {};
    var fetch_admin_data_promise = Promise.all(
      init_dict.initial_countries_to_load.map((function(country_code) {
        console.log('Fetching admins for', country_code);
        return init_dict.api_client.fetch_admin_data(country_code)
          .then(this.process_admin_data.bind(this, country_code));
      }).bind(this)))
        .catch(function(err) { console.error(err); });
    this.initial_load_promise = Q.all([this.epi_data_store.initial_load_promise,
                                       this.weather_data_store.initial_load_promise,
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
  }

});

module.exports = AdminDetails;
