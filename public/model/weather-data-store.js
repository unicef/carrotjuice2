/**
 * Stores all weather data.
 */

var _ = require('lodash');
var P = require('pjs').P;
var d3 = require('d3');

var FakeOvipositionDataStore = P({
  init: function(weather_data_store) {
    this.weather_data_store = weather_data_store;
  },

  region_color_for_date: function(date_string) {
    // TODO(jetpack): Use real science and stuff.
    var temp_to_oviposition = d3.scale.sqrt().domain([1, 50])
      .range(['white', 'purple', 'red']);

    return _.mapValues(
      this.weather_data_store.data_by_date_and_region[date_string],
      function(data_obj) {
        return temp_to_oviposition(data_obj.temp_mean);
      }
    );
  }
});

var WeatherDataStore = P({
  init: function(on_update, api_client) {
    this.api_client = api_client;
    this.on_update = on_update;
    // `data_by_date_and_region` format is ISO date string -> region code ->
    // weather data. Currently weather data just has a single field,
    // `temp_mean`.
    this.data_by_date_and_region = {};
    this.last_date = null;
    // TODO(jetpack): change this to call fetch_country_data. one difference is
    // that here, we update `last_date`.
    this.initial_load_promise = api_client.fetch_weather_data()
      .then((function(data) {
        this.last_date = new Date(_.keys(data)[0]);
        _.assign(this.data_by_date_and_region, data);
      }).bind(this));
  },

  // TODO(jetpack): when re-clicking a region, we re-fetch this data. it's
  // cached on the backend, so it's not slow, but still.
  fetch_region_data: function(region_code, n_days) {
    console.log('Fetching weather for region', region_code, 'for', n_days, 'days..');
    this.api_client.fetch_region_weather_data(region_code, n_days).then((function(data) {
      console.log('..Got', _.size(data), 'days of data for region', region_code);
      this.data_by_date_and_region = _.merge(this.data_by_date_and_region, data);
      this.on_update();
    }).bind(this));
  },

  fetch_country_data: function(date) {
    console.log('Fetching weather for all regions for date', date);
    this.api_client.fetch_weather_data(date).then((function(data) {
      _.assign(this.data_by_date_and_region, data);
      this.on_update();
    }).bind(this));
  },

  // TODO(jetpack): if there's missing data, the returned object will contain
  // `undefined` entries.
  weather_data_by_date_for_region: function(region_code) {
    return _.mapValues(this.data_by_date_and_region, function(region_data) {
      return region_data[region_code];
    });
  },

  region_color_for_date: function(date_string) {
    // TODO(jetpack): Use real science and stuff.
    var temp_to_prevalence = d3.scale.log().domain([1, 50])
      .range(['green', 'yellow', 'red']);

    return _.mapValues(
      this.data_by_date_and_region[date_string],
      function(data_obj) {
        if (data_obj.temp_mean < 1 || data_obj.temp_mean > 50) {
          console.warn("Weather data store: temperature is outside of expected range.");
        }
        return temp_to_prevalence(data_obj.temp_mean);
      }
    );
  },

  fake_oviposition_model: function() {
    return FakeOvipositionDataStore(this);
  },

  on_region_select: function(region_codes) {
    region_codes.forEach((function(region_code) {
      this.fetch_region_data(region_code);
    }).bind(this));
  },

  on_date_select: function(date) {
    this.fetch_country_data(date);
  }

});

module.exports = WeatherDataStore;
