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
      this.weather_data_store.data_by_date[date_string],
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
    // `data_by_date` format is ISO date string -> region code -> weather data.
    // Currently weather data is just has a single field, `temp_mean`.
    this.data_by_date = {};
    this.last_date = null;
    this.initial_load_promise = api_client.fetch_weather_data()
      .then((function(data) {
        this.last_date = new Date(_.keys(data)[0]);
        _.assign(this.data_by_date, data);
      }).bind(this));
  },

  // TODO(jetpack): when re-clicking a region, we re-fetch this data. it's
  // cached on the backend, so it's not slow, but still.
  fetch_historical_data: function(region_code, n_days) {
    console.log('Fetching weather for region', region_code, 'for', n_days, 'days..');
    this.api_client.fetch_region_weather_data(region_code, n_days).then((function(data) {
      console.log('..Got', _.size(data), 'days of data for region', region_code);
      this.data_by_date = _.merge(this.data_by_date, data);
      this.on_update();
    }).bind(this));
  },

  weather_data_for_region: function(region_code) {
    return _.mapValues(this.data_by_date, function(region_data) {
      return region_data[region_code];
    });
  },

  region_color_for_date: function(date_string) {
    // TODO(jetpack): Use real science and stuff.
    var temp_to_prevalence = d3.scale.log().domain([1, 50])
      .range(['green', 'yellow', 'red']);

    return _.mapValues(
      this.data_by_date[date_string],
      function(data_obj) {
        return temp_to_prevalence(data_obj.temp_mean);
      }
    );
  },

  fake_oviposition_model: function() {
    return FakeOvipositionDataStore(this);
  },

  on_region_select: function(region_codes) {
    region_codes.forEach((function(region_code) {
      this.fetch_historical_data(region_code);
    }).bind(this));
  }
});

module.exports = WeatherDataStore;
