var P = require('pjs').P;
var draw_initial_map = require('./draw-initial-map.js');
var _ = require('lodash');
var topojson = require('topojson');

var MapController = P({
  init: function(api_client, loading_status_model, data_layer_model) {
    this.loading_status_model = loading_status_model;
    this.data_layer_model = data_layer_model;
    this.get_region_data_promise = api_client.get_region_data()
      .then(function(data) {
        if (data.type !== "Topology") {
          window.alert("Bad JSON data");
        } else {
          return _.map(data.objects, function(datum) {
            return topojson.feature(data, datum);
          });
        }
      });
  },

  /**
   * @param map_element DOM element to mount the map to
   */
  initialize: function(map_element) {
    if (this.map_element) {
      alert("INTERNAL ERROR: MapController getting initialized twice.");
    }
    this.map_element = map_element;
    this.map = draw_initial_map(map_element);
    setTimeout(this.post_initial_load.bind(this), 200);
  },

  on_each_feature: function() {
  },

  get_region_style: function() {
    return {};
  },

  /**
   * Adds polygons to map. This is done later, so that we can
   * show the initial map to the user first.
   */
  post_initial_load: function() {
    this.get_region_data_promise.then((function(region_data) {
      this.regions_layer = L.geoJson(
        region_data,
        {
          onEachFeature: this.on_each_feature.bind(this),
          style: this.get_region_style.bind(this)
        }
      );
      this.map.addLayer(this.regions_layer);
      this.loading_status_model.setLoadedTopojson();
    }).bind(this));
  }
});

module.exports = MapController;
