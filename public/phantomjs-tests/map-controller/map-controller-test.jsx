var $ = require('jquery');
var assert = require('assert');
var Q = require('q');
var React = require('react');  // required to be in scope post-JSX compilation
var ReactDOM = require('react-dom');

var MockApiClient = require('../api-client/api-client-mock.js');
var DataLayer = require('../../model/data-layer.js');
var WeatherDataStore = require('../../model/weather-data-store.js');
var SelectedDate = require('../../model/selected-date.js');
var MapColoring = require('../../model/map-coloring.js');
var LeafletMap = require('../../view/leaflet-map.jsx');
var MapController = require('../../map-controller/map-controller.js');
var RegionDetails = require('../../model/region-details');
var SelectedRegions = require('../../model/selected-regions.js');
var LoadingStatusModel = require('../../model/loading-status.js');

var setup_controller = function() {
  var rerender = function() {};
  var loading_status = new LoadingStatusModel(rerender);
  var api_client = new MockApiClient('br');
  var weather_data_store = new WeatherDataStore(function() {}, api_client);
  var data_layer = new DataLayer(function() {});
  var selected_regions = new SelectedRegions(rerender);
  var region_details = new RegionDetails(rerender, api_client, selected_regions, weather_data_store);
  var selected_date = new SelectedDate(rerender, weather_data_store);
  var map_coloring = new MapColoring({
    data_layer: data_layer,
    selected_date: selected_date,
    weather_data_store: weather_data_store
  });
  return new MapController(loading_status, region_details, selected_regions, map_coloring);
};

// pass the result to a `then` block.
var wait_for_element = function(name) {
  return function() {
    var element = $(name);
    if (element.length > 0) {
      return element;
    } else {
      return Q.delay(1).then(wait_for_element(name));
    }
  };
};

describe('map-controller/map-controller', function() {
  it('mounts and renders a region', function() {
    var data_layer = {
      data_layer: 'test_layer',
      display_name: function() {
        return 'test display name';
      },
      get_valid_layers: function() {
        return [];
      }
    };
    var controller = setup_controller();

    return Q().then(function() {
      ReactDOM.render(
        <LeafletMap controller={controller}/>,
        window.test_content_div
      );
    }).then(wait_for_element('path.leaflet-clickable')).then(function(x) {
      var map_region = $('path.leaflet-clickable');
      assert.strictEqual(map_region.length, 1);

      var dimensions = map_region.get(0).getBoundingClientRect();
      assert.deepEqual("#57ab00", map_region.attr("fill"));
      assert.ok(Math.abs(dimensions.width - 21) < 5, "width close to 21");
      assert.ok(Math.abs(dimensions.height - 32) < 5, "height close to 32");
    });
  });
});
