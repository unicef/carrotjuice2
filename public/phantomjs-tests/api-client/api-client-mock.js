/**
 * Mock API client that returns some fake data (e.g. real data
 * for the first admin or something).
 */

var P = require('pjs').P;
var Q = require('q');
var mock_topojson_result = require('./mock_topojson_result.json');

var APIClient = P({
  fetch_admin_data: function() {
    return Q(mock_topojson_result);
  },
  fetch_country_weather_data: function() {
    return Q({
      "2016-03-10T00:00:00.000Z": {
        "br-1": {
          temp_mean: -3.81
        }
      }
    });
  },
  fetch_admin_weather_data: function(admin_code) {
    var inner = {};
    inner[admin_code] = {temp_mean: 5};
    return Q({
      "2016-03-10T00:00:00.000Z": inner
    });
  }
});

module.exports = APIClient;
