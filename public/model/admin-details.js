/**
 * Model for admin details. Combines other models (selected admins, etc.) and data stores.
 */

var _ = require('lodash');
var P = require('pjs').P;
var Q = require('q');
var d3 = require('d3');
var topojson = require('topojson');

// Used by MapColoring for the population density base layer.
var PopulationDensityModel = P({
  init: function(admin_details) {
    admin_details.initial_load_promise.then((function() {
      this.admin_color_by_code = this.get_color_mapping(admin_details.admin_data_by_code);
    }).bind(this));
  },

  get_color_mapping: function(admin_data_by_code) {
    console.log('generating admin population density chloropleth - should only run once!');
    var density_to_color = d3.scale.log().domain([1, 1000])
        .range(['white', 'purple']).clamp(true);
    var result = {};
    _.forEach(admin_data_by_code, function(admin_data, admin_code) {
      var density = admin_data.population / admin_data.geo_area_sqkm;
      // Guard against one (or both) of admin_data fields being unset.
      if (density) {
        result[admin_code] = density_to_color(density);
      }
    });
    return result;
  },

  admin_color_for_date: function() {
    return this.admin_color_by_code;
  }
});

var SocioeconomicModel = P({
  init: function(admin_details) {
    admin_details.initial_load_promise.then((function() {
      this.admin_color_by_code = this.get_color_mapping(
        admin_details.admin_data_by_code, admin_details.econ_data_store.spending_by_admin);
    }).bind(this));
  },

  get_color_mapping: function(admin_data_by_code, spending_by_code) {
    console.log('generating socioeconomic chloropleth');
    // TODO(jetpack): log vs. linear, domain?
    var spending_to_color = d3.scale.log().domain([1, 100])
        .range(['red', '#0d5']).clamp(true);

    var result = {};
    _.forEach(spending_by_code, function(spending, admin_code) {
      if (admin_data_by_code[admin_code] && admin_data_by_code[admin_code].population) {
        var normalized_spending = spending / admin_data_by_code[admin_code].population;
        result[admin_code] = spending_to_color(normalized_spending);
      }
    });
    console.log(result);
    return result;
  },

  admin_color_for_date: function() {
    return this.admin_color_by_code;
  }
});

var AdminDetails = P({
  init: function(init_dict) {
    this.on_update = init_dict.on_update;
    this.selected_admins = init_dict.selected_admins;
    this.econ_data_store = init_dict.econ_data_store;
    this.epi_data_store = init_dict.epi_data_store;
    this.weather_data_store = init_dict.weather_data_store;
    // TODO(jetpack): maybe this should be a separate class, like weather_data_store.
    // `admin_data_by_code` is a map from admin code to admin data. Admin data has fields `name`,
    // `admin_code`, `geo_area_sqkm`, and possibly `population`.
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
    this.initial_load_promise = Q.all([this.econ_data_store.initial_load_promise,
                                       this.epi_data_store.initial_load_promise,
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
  },

  population_density_model: function() {
    return new PopulationDensityModel(this);
  },

  socioeconomic_model: function() {
    return new SocioeconomicModel(this);
  }

});

module.exports = AdminDetails;
