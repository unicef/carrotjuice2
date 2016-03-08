/**
 * NOTE: For now, we just throw a bunch of API logic together. This probably isn't the best
 * approach.
 */

var P = require('pjs').P;
var Q = require('q');
var jQuery = require('jquery');
var DateUtil = require('../model/date-util.js');

var SUPPORTED_COUNTRIES = ['br'];

var makeRequest = function(url) {
  var deferred = Q.defer();

  jQuery.ajax({
    method: 'GET',
    url: url,
    success: function(data) {
      deferred.resolve(data);
    },
    fail: function(error) {
      deferred.reject(error);
    }
  });

  return deferred.promise;
};

var APIClient = P({
  init: function(country_code) {
    if (!SUPPORTED_COUNTRIES.includes(country_code)) {
      alert("INTERNAL ERROR: country '" + country_code + "' not supported");
    }
    this.country_code = country_code;
  },
  fetch_region_data: function() {
    return makeRequest("/api/admin_polygons_topojson/" + this.country_code);
  },
  fetch_weather_data: function(date) {
    // When no date_str specified, we get the latest data available.
    var date_str = '';
    if (date === undefined) {
      console.log('No date specified - fetching latest available data..');
    } else {
      date_str = '/' + DateUtil.iso_to_yyyymmdd(date);
    }
    return makeRequest('/api/country_weather/' + this.country_code + date_str);
  },
  fetch_region_weather_data: function(region_code, num_days) {
    if (num_days === undefined) {
      num_days = 180;
    }
    var today = new Date();
    var start_date = DateUtil.subtract_days(today, num_days);
    return makeRequest('/api/region_weather/' + this.country_code + '/' + region_code + '/' +
                       DateUtil.iso_to_yyyymmdd(start_date) + '/' +
                       DateUtil.iso_to_yyyymmdd(today));
  }
});

module.exports = APIClient;
