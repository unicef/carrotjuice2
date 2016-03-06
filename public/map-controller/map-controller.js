var P = require('pjs').P;
var draw_initial_map = require('./draw-initial-map.js');

var MapController = P({
  init: function(get_region_data_promise) {
    this.get_region_data_promise = get_region_data_promise;
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

  /**
   * Adds polygons to map. This is done later, so that we can
   * show the initial map to the user first.
   */
  post_initial_load: function() {
    this.get_region_data_promise.then((function(region_data) {
      var topoLayer = new L.GeoJSON();
      topoLayer.addData(region_data);

      topoLayer.eachLayer(function(layer) {
        var f = layer.feature;

        /*
         f.properties.scaled_population =
         log_rescale(admin_populations[admin_name_to_index[f.id]],
         admin_population_stats.min,
         admin_population_stats.max);
         layer.setStyle({
         stroke: false,
         fillOpacity: f.properties.scaled_population
         });
         */
        layer.setStyle({
          stroke: false
        });

        if (f.properties && f.properties.admin_2_name) {
          layer.bindPopup(f.properties.admin_2_name);
        }
      });

      topoLayer.addTo(this.map);
      console.log('Added to map!');
    }).bind(this));
  }
});

module.exports = MapController;
