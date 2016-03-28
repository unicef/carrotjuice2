/**
 * Stores all weather data.
 */

var _ = require('lodash');
var P = require('pjs').P;
var d3 = require('d3');
var SelectionEvents = require('../event-emitters/selection-events.js');

var OvipositionModel = P({
  init: function(weather_data_store) {
    this.weather_data_store = weather_data_store;
    // `temp_to_oviposition` ranges from -Infinity to ~8.8. Negative values are treated as 0. We map
    // this linearly to a green, yellow, orange color gradient.
    this.oviposition_to_color = d3.scale.linear().domain([0, 4.4, 8.8]).clamp(true)
      .range(['#b4d642', '#f8cd4e', '#ff7f47']);
  },

  // TODO(jetpack): confirm this is the correct source.
  // See the paper "Vectorial Capacity of Aedes aegypti: Effects of Temperature and Implications for
  // Global Dengue Epidemic Potential"
  // http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0089783
  temp_to_oviposition: function(x) {
    return -5.4 + 1.8 * x - 0.2124 * Math.pow(x, 2) + 0.01015 * Math.pow(x, 3) -
      0.0001515 * Math.pow(x, 4);
  },

  admin_color_for_date: function(date_string) {
    return _.mapValues(
      this.weather_data_store.data_by_date_and_admin[date_string],
      (function(data_obj) {
        return this.oviposition_to_color(this.temp_to_oviposition(data_obj.temp_mean));
      }).bind(this)
    );
  }
});

var WeatherDataStore = P({
  init: function(on_update, api_client, initial_countries_to_load) {
    this.on_update = on_update;
    this.api_client = api_client;
    // `data_by_date_and_admin` format is ISO date string -> admin code ->
    // weather data. Currently weather data just has a single field,
    // `temp_mean`.
    this.data_by_date_and_admin = {};
    this.oviposition_model = new OvipositionModel(this);
    // TODO(jetpack): globalhack: `last_date` should be per-country.
    this.last_date = null;
    this.initial_load_promise = Promise.all(
      initial_countries_to_load.map((function(country_code) {
        return this.fetch_country_data(country_code, null);
      }).bind(this)))
      .then((function() {
        if (!_.isEmpty(this.data_by_date_and_admin)) {
          this.last_date = new Date(_.keys(this.data_by_date_and_admin)[0]);
        }
      }).bind(this))
      .catch(function(err) { console.error('Problem loading initial weather data:', err); });
  },

  // TODO(jetpack): when re-clicking a admin, we re-fetch this data. it's
  // cached on the backend, so it's not slow, but still.
  fetch_admin_data: function(admin_code, n_days) {
    console.log('Fetching weather for admin', admin_code, 'for', n_days, 'days..');
    return this.api_client.fetch_admin_weather_data(admin_code, n_days).then((function(data) {
      console.log('..Got', _.size(data), 'days of data for admin', admin_code);
      this.data_by_date_and_admin = _.merge(this.data_by_date_and_admin, data);
    }).bind(this));
  },

  fetch_country_data: function(country_code, date) {
    console.log('Fetching weather for country', country_code, 'for date', date || '<latest date>');
    return this.api_client.fetch_country_weather_data(country_code, date).then((function(data) {
      console.log('..Got', _.size(data), 'days of data for country', country_code);
      this.data_by_date_and_admin = _.merge(this.data_by_date_and_admin, data);
    }).bind(this));
  },

  // TODO(jetpack): if there's missing data, the returned object will contain
  // `undefined` entries.
  weather_data_by_date_for_admin: function(admin_code) {
    return _.mapValues(this.data_by_date_and_admin, function(admin_data) {
      return admin_data[admin_code];
    });
  },

  weather_data_for_date_and_admin: function(date, admin_code) {
    return _.get(this.data_by_date_and_admin, [date.toISOString(), admin_code]);
  },

  admin_color_for_date: function(date_string) {
    // TODO(jetpack): Use real science and stuff.
    var temp_to_color = d3.scale.linear().domain([15, 25, 35]).clamp(true)
      .range(['green', 'yellow', 'red']);
    return _.mapValues(this.data_by_date_and_admin[date_string],
                       function(data_obj) { return temp_to_color(data_obj.temp_mean); });
  },

  on_admin_select: function(admin_codes) {
    return Promise.all(admin_codes.map((function(admin_code) {
      return this.fetch_admin_data(admin_code);
    }).bind(this)))
      .then(this.on_update.bind(this));
  },

  on_date_select: function(country_codes, date) {
    return Promise.all(country_codes.map((function(country_code) {
      return this.fetch_country_data(country_code, date);
    }).bind(this)))
      .then(this.on_update.bind(this));
  },

  on_country_select: function(country_codes, date) {
    return this.on_date_select(country_codes, date);
  }
});

module.exports = WeatherDataStore;
