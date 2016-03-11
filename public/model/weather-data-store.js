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
  init: function(on_update, api_client, initial_country_codes) {
    this.api_client = api_client;
    this.on_update = on_update;
    // `data_by_date_and_region` format is ISO date string -> region code ->
    // weather data. Currently weather data just has a single field,
    // `temp_mean`.
    this.data_by_date_and_region = {};
    // TODO(jetpack): globalhack: `last_date` should be per-country.
    this.last_date = null;
    this.initial_load_promise = Promise.all(
      initial_country_codes.map((function(country_code) {
        return this.fetch_country_data(country_code, null);
      }).bind(this)))
      .then((function() {
        if (!_.isEmpty(this.data_by_date_and_region)) {
          this.last_date = new Date(_.keys(this.data_by_date_and_region)[0]);
        }
      }).bind(this))
      .catch(function(err) { console.error('Problem loading initial weather data:', err); });
  },

  // TODO(jetpack): when re-clicking a region, we re-fetch this data. it's
  // cached on the backend, so it's not slow, but still.
  fetch_region_data: function(region_code, n_days) {
    console.log('Fetching weather for region', region_code, 'for', n_days, 'days..');
    return this.api_client.fetch_admin_weather_data(region_code, n_days).then((function(data) {
      this.data_by_date_and_region = _.merge(this.data_by_date_and_region, data);
      console.log('..Got', _.size(data), 'days of data for region', region_code);
    }).bind(this));
  },

  fetch_country_data: function(country_code, date) {
    console.log('Fetching weather for country', country_code, 'for date', date || '<latest date>');
    return this.api_client.fetch_country_weather_data(country_code, date).then((function(data) {
      console.log('..Got', _.size(data), 'days of data for country', country_code);
      this.data_by_date_and_region = _.merge(this.data_by_date_and_region, data);
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
    this.on_update();
  },

  on_date_select: function(country_codes, date) {
    country_codes.forEach((function(country_code) {
      this.fetch_country_data(country_code, date);
    }).bind(this));
    this.on_update();
  }

});

module.exports = WeatherDataStore;
