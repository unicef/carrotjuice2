/**
 * Mock API client that returns some fake data (e.g. real data
 * for the first region or something).
 */

var P = require('pjs').P;
var Q = require('q');
var mock_topojson_result = require('./mock_topojson_result.json');

var APIClient = P({
  init: function(country_code) {
    this.country_code = country_code;
  },
  fetch_region_data: function() {
    return Q(mock_topojson_result);
  },
  fetch_weather_data: function() {
    return Q({
      "2016-03-10T00:00:00.000Z": {
        4877: {
          temp_mean: 3.81
        }
      }
    });
  },
  fetch_region_weather_data: function(region_code) {
    var inner = {};
    inner[region_code] = {temp_mean: 5};
    return Q({
      "2016-03-10T00:00:00.000Z": inner
    });
  }
});

module.exports = APIClient;
