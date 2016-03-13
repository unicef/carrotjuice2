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
    // GeoJSON FeatureCollection. The features' properties include the region
    // data fields.
    this.region_feature_collection = {};
    var fetch_region_data_promise = init_dict.api_client.fetch_region_data()
        .then(this.process_region_data.bind(this))
        .fail(function(err) { console.error(err); });
    this.initial_load_promise = Q.all([this.epi_data_store.initial_load_promise,
                                       this.weather_data_store.initial_load_promise,
                                       fetch_region_data_promise]);
  },

  process_region_data: function(data) {
    if (data.type !== 'Topology') {
      throw new Error('Bad JSON data');
    } else {
      this.region_feature_collection = topojson.feature(data, data.objects.collection);
      var region_data_by_code = this.region_data_by_code;
      data.objects.collection.geometries.forEach(function(obj) {
        // FWIW, `properties` also has `country_code` .
        region_data_by_code[obj.properties.region_code] =
          _.pick(obj.properties, ['name', 'region_code', 'geo_area_sqkm']);
      });
    }
  },

  get_geojson_features: function() {
    return this.region_feature_collection.features;
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
