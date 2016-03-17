/**
 * NOTE: For now, we just throw a bunch of API logic together. This probably isn't the best
 * approach.
 */

var P = require('pjs').P;
var Q = require('q');
var jQuery = require('jquery');
var DateUtil = require('../model/date-util.js');

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
  fetch_admin_data: function(country_code) {
    return makeRequest("/api/admin_polygons_topojson/" + country_code);
  },
  fetch_country_weather_data: function(country_code, date) {
    var date_str = '';
    if (date) {
      date_str = '/' + DateUtil.iso_to_yyyymmdd(date);
    } else {
      console.log('No date specified - fetching latest available data..');
    }
    return makeRequest('/api/country_weather/' + country_code + date_str);
  },
  fetch_admin_weather_data: function(admin_code, num_days) {
    if (num_days === undefined) {
      num_days = 180;
    }
    var today = new Date();
    var start_date = DateUtil.subtract_days(today, num_days);
    return makeRequest('/api/admin_weather/' + admin_code + '/' +
                       DateUtil.iso_to_yyyymmdd(start_date) + '/' +
                       DateUtil.iso_to_yyyymmdd(today));
  },
  fetch_egress_mobility_data: function(admin_code, date) {
    var d = '/' + DateUtil.iso_to_yyyymmdd(date);
    return makeRequest('/api/egress_mobility/' + admin_code + d + d);
  }
});

module.exports = APIClient;
