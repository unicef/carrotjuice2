/**
 * Model for region details. Combines other models (selected regions, etc.) and data stores.
 */

var P = require('pjs').P;
var Q = require('q');
var topojson = require('topojson');

var RegionDetails = P({
  init: function(init_dict) {
    this.on_update = init_dict.on_update;
    this.selected_regions = init_dict.selected_regions;
    this.epi_data_store = init_dict.epi_data_store;
    this.weather_data_store = init_dict.weather_data_store;
    // TODO(jetpack): maybe this should be a separate class, like weather_data_store.
    // `region_data_by_code` is a map from region code to region data. Region
    // data has fields `name`, `region_code`, and `geo_area_sqkm`.
    this.region_data_by_code = {};
    // Map from country code to GeoJSON FeatureCollection. The features' properties include the
    // region data fields.
    this.region_feature_collection_by_country = {};
    var fetch_region_data_promise = Promise.all(
      init_dict.initial_countries_to_load.map((function(country_code) {
        console.log('Fetching admins for', country_code);
        return init_dict.api_client.fetch_admin_data(country_code)
          .then((function(data) {
            this.process_region_data(country_code, data);
          }.bind(this)));
      }).bind(this)))
        .catch(function(err) { console.error(err); });
    this.initial_load_promise = Q.all([this.epi_data_store.initial_load_promise,
                                       this.weather_data_store.initial_load_promise,
                                       fetch_region_data_promise]);
  },

  process_region_data: function(country_code, data) {
    if (data.type !== 'Topology') {
      throw new Error('Bad JSON data');
    } else {
      this.region_feature_collection_by_country[country_code] =
        topojson.feature(data, data.objects.collection);
      var region_data_by_code = this.region_data_by_code;
      data.objects.collection.geometries.forEach(function(obj) {
        // FWIW, `properties` also has `country_code` .
        region_data_by_code[obj.properties.admin_code] =
          _.pick(obj.properties, ['name', 'admin_code', 'geo_area_sqkm']);
      });
    }
  },

  // TODO(jetpack): globalhack: this should be per country.
  get_geojson_features: function() {
    return _.reduce(
      this.region_feature_collection_by_country, function(result, feature_collection) {
        return _.concat(result, feature_collection.features);
      }, []);
  },

  get_region_properties: function(region_code) {
    return this.region_data_by_code[region_code];
  },

  get_selected_regions_data: function() {
    var region_data_by_code = this.region_data_by_code;
    return this.selected_regions.get_region_codes().map(function(region_code) {
      return region_data_by_code[region_code];
    });
  },

  get_epi_data_display_strings: function(date, region_code) {
    var epi_data = this.epi_data_store.get_recent_epi_data_for_region(date, region_code);
    if (epi_data) {
      return this.epi_data_store.case_data_to_display_strings(
        epi_data.region_case_data[region_code], epi_data.start_time, epi_data.end_time);
    }
  }

});

module.exports = RegionDetails;
