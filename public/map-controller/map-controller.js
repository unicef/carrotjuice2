var P = require('pjs').P;
var Q = require('q');
var draw_initial_map = require('./draw-initial-map.js');
var _ = require('lodash');
var topojson = require('topojson');

// NOTE: this function WILL NOT work when latitude wraps around (the -180 / 180 zone)
var make_distance_from_viewport_center = function(bounds) {
  var viewport_lat = (bounds._southWest.lat + bounds._northEast.lat) / 2;
  var viewport_lng = (bounds._southWest.lng + bounds._northEast.lng) / 2;

  var rough_distance = function(coordinate) {
    var lng = coordinate[0];
    var lat = coordinate[1];
    var d_lat = (lat - viewport_lat);
    var d_lng = (lng - viewport_lng);
    return d_lat * d_lat + d_lng * d_lng;
  };

  return function(polygon) {
    if (polygon.type === 'Feature') {
      polygon = polygon.geometry;
    }
    if (polygon.type === 'Polygon') {
      // See documentation: The first [0] gets the outer permiter line (series of points),
      // and the second [0] gets the first point of that line.
      return rough_distance(polygon.coordinates[0][0]);
    } else if (polygon.type === 'MultiPolygon') {
      return rough_distance(polygon.coordinates[0][0][0]);
    } else {
      console.error('Unknown shape type', polygon);
      return false;
    }
  };
};

var MapController = P({
  init: function(api_client, loading_status_model, selected_regions, map_coloring) {
    this.loading_status_model = loading_status_model;
    this.map_coloring = map_coloring;
    this.regions_layers = [];
    this.selected_regions = selected_regions;
    this.get_region_data_promise = api_client.get_region_data()
      .then((function(data) {
        if (data.type !== 'Topology') {
          window.alert('Bad JSON data');
        } else {
          this.region_data = topojson.feature(data, data.objects.collection);
          window.region_data = this.region_data;  // for debugging
        }
      }).bind(this)).fail(function(err) {
        console.error(err);
      });
  },

  /**
   * @param map_element DOM element to mount the map to
   */
  initialize: function(map_element) {
    if (this.map_element) {
      alert('INTERNAL ERROR: MapController getting initialized twice.');
    }
    this.map_element = map_element;
    this.map = draw_initial_map(map_element);
    window._leaflet_map = this.map;  // save a reference for easier debugging
    Q.all([
      this.map_coloring.load_promise,
      this.get_region_data_promise
    ])
      .then(this.post_initial_load.bind(this))
      .fail(function(error) {
        console.error(error);
      });
  },

  on_each_feature: function(feature, layer) {
    var map = this.map;
    var regions_layers = this.regions_layers;
    var selected_regions = this.selected_regions;

    var region_popup = L.popup({
      autoPan: false,
      closeButton: false,
      offset: L.point(0, -10),
      // Note: style for this popup is in leaflet-map.css.
      className: 'region-popup'
    }, layer);
    region_popup.setContent('<b>' + feature.properties.name + '</b>');

    // Draw popup that tracks mouse movement.
    var mousemove = function(e) {
      region_popup.setLatLng(e.latlng);
      map.openPopup(region_popup);
    };
    // Bolder border stroke when mouse enters.
    var mouseover = function(e) {
      e.target.setStyle({
        weight: 3
      });
    };
    // Restore original style when mouse leaves.
    var mouseout = function(e) {
      // Note: `map.openPopup` ensures only 1 popup is open at a time, but we
      // still call `closePopup` on mouseout for when the mouse moves from an
      // region to a non-region (e.g., the sea, or outside the country).
      map.closePopup(region_popup);
      _.forEach(regions_layers, function(layer) {
        layer.resetStyle(e.target);
      });
    };
    var click = function(e) {
      selected_regions.toggle_region(feature.properties.region_code);
    };
    layer.on({
      mousemove: mousemove,
      mouseover: mouseover,
      mouseout: mouseout,
      click: click
    });
  },

  get_region_style_fcn: function() {
    var weight = 1;
    var active_data = this.map_coloring.active_data();
    return function(feature) {
      return {
        fillColor: active_data[feature.properties.region_code],
        fillOpacity: 1,
        color: '#000',  // Border color.
        opacity: 1,
        weight: weight
      };
    };
  },

  redraw: function() {
    var style_fcn = this.get_region_style_fcn();
    _.forEach(this.regions_layers, function(layer) {
      layer.setStyle(style_fcn);
    });
  },

  /**
   * Loads a chunk of polygon features. This makes it so we don't tie up the UI threads.
   */
  load_feature_chunk: function(features) {
    var region_data = {type: 'FeatureCollection', features: features};
    var map = this.map;
    var regions_layer = L.geoJson(
      region_data,
      {
        onEachFeature: this.on_each_feature.bind(this),
        style: this.get_region_style_fcn()
      }
    );
    map.addLayer(regions_layer);
    this.regions_layers.push(regions_layer);
  },

  /**
   * Adds polygons to map. This is done later, so that we can
   * show the initial map to the user first.
   */
  post_initial_load: function() {
    var distance_fcn = make_distance_from_viewport_center(this.map.getBounds());
    var features_by_distance = _.sortBy(this.region_data.features, distance_fcn);

    var sequence = Q(null).then(
      this.load_feature_chunk.bind(this, _.take(features_by_distance, 500))
    ).then(function() {
      this.loading_status_model.setLoadedTopojson();
    }.bind(this));

    _.forEach(_.chunk(_.drop(features_by_distance, 500), 2500), (function(feature) {
      sequence = sequence.delay(10).then(this.load_feature_chunk.bind(this, feature));
    }).bind(this));

    sequence.fail(function(err) {
      console.error(err);
    });
  }
});

module.exports = MapController;
