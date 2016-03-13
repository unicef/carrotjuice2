/**
 * Mock API client that returns some fake data (e.g. real data
 * for the first region or something).
 */

var lodash = require('lodash');
var assert = require('assert');
var MockApiClient = require('./api-client-mock.js');

describe('api-client/api-client-mock', function() {
  it('returns topojson', function() {
    var client = new MockApiClient('br');
    return client.fetch_region_data().then(function(data) {
      assert.strictEqual(data.type, "Topology");
      assert.strictEqual(data.objects.collection.type, "GeometryCollection");
      assert.strictEqual(
        data.objects.collection.geometries[0].properties.country_code, "br"
      );
    });
  });

  it('returns weather data', function() {
    var client = new MockApiClient('br');
    return client.fetch_weather_data().then(function(data) {
      assert.strictEqual(lodash.values(data)[0][4877].temp_mean, 3.81);
    });
  });
});
