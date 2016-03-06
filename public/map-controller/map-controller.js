var P = require('pjs').P;
var basemaps = require('./basemaps.js');

var MapController = P({
  /**
   * @param map_element DOM element to mount the map to
   */
  initialize: function(map_element) {
    if (this.map_element) {
      alert("INTERNAL ERROR: MapController getting initialized twice.");
    }
    this.map_element = map_element;

    var map_center = [-23.3, -46.3];  // São Paulo.
    var map_zoom = 6;
    // When zoomed out more, the polygons look really messed up. This zoom
    // level already shows all of Brazil.
    var min_map_zoom = 5;
    var max_map_zoom = 12;
    var map_region_layer = L.layerGroup();

    var overlays = {
      'Administrative regions': map_region_layer
    };

    var map = L.map(map_element, {
      center: map_center,
      zoom: map_zoom,
      minZoom: min_map_zoom,
      maxZoom: max_map_zoom,
      fadeAnimation: false,
      layers: [basemaps.CartoDB, map_region_layer],
      zoomControl: false  // Added manually below.
    });
    this.map = map;

    map.attributionControl.setPrefix('Carotene');
    L.control.layers(basemaps, overlays).addTo(map);
    L.control.scale({position: 'bottomright'}).addTo(map);
    // The zoom control is added manually so that it's above the scale control.
    L.control.zoom({position: 'bottomright'}).addTo(map);
  }
});

module.exports = MapController;
