var P = require('pjs').P;
var Q = require('q');
var draw_initial_map = require('./draw-initial-map.js');
var _ = require('lodash');
var d3 = require('d3');

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

var obj_to_alist = function(obj) {
  var result = [];
  _.forEach(obj, function(val, key) {
    result.push([key, val]);
  });
  return result;
};

var MapController = P({
  init: function(init_dict) {
    this.loading_status = init_dict.loading_status;
    this.admin_details = init_dict.admin_details;
    this.selected_admins = init_dict.selected_admins;
    this.map_coloring = init_dict.map_coloring;
    // `admins_layers_by_country` is a map from country code to array of Leaflet GeoJSON layers.
    this.admins_layers_by_country = {};
    this.overlay_layers = [];
    // TODO(jetpack): the latlng stored is just the center of the bounding box,
    // which can be very terrible. instead, we should compute the centroid in
    // the backend: https://github.com/mikefab/majicbox/issues/6
    this.admin_code_to_latlng = {};
    this.coords = init_dict.focus;
  },

  /**
   * @param{object} map_element -- DOM element to mount the map to
   */
  initialize: function(map_element) {
    if (this.map_element) {
      console.error('INTERNAL ERROR: MapController getting initialized twice.');
    }
    this.map_element = map_element;
    this.map = draw_initial_map(map_element, this.coords);
    window._leaflet_map = this.map;  // save a reference for easier debugging
    // TODO(jetpack): We redraw on zoom because we only want to admin borders when zoomed in past a
    // certain level. This should only require `setStyle` on all admin layers, not a full `redraw`.

    this.map.on('zoomend', this.redraw.bind(this));
    Q.all([this.map_coloring.initial_load_promise,
           this.admin_details.initial_load_promise])
      .then(this.post_initial_load.bind(this))
      .fail(function(error) {
        console.error(error);
      });
  },

  popup_options: {
    autoPan: false,
    closeButton: false,
    offset: L.point(0, -10),
    // Note: style for this popup is in leaflet-map.css.
    className: 'carotene-popup'
  },

  on_each_feature: function(feature, layer) {
    var map = this.map;
    var selected_admins = this.selected_admins;
    var admin_code = feature.properties.admin_code;
    var admin_popup = L.popup(this.popup_options, layer);
    admin_popup.setContent('<b>' + feature.properties.name + '</b>');
    var set_border = function(e) {
      e.target.setStyle({weight: selected_admins.get_border_weight(admin_code)});
    };

    // Store geo center for each admin.
    this.admin_code_to_latlng[admin_code] = layer.getBounds().getCenter();

    // Set up handlers.
    var mousemove = function(e) {
      admin_popup.setLatLng(e.latlng);
      map.openPopup(admin_popup);
    };
    var mouseover = function(e) {
      selected_admins.set_admin_hovered(admin_code);
      set_border(e);
    };
    var mouseout = function(e) {
      // Note: `map.openPopup` ensures only 1 popup is open at a time, but we
      // still call `closePopup` on mouseout for when the mouse moves from an
      // admin to a non-admin (e.g., the sea, or outside the country).
      map.closePopup(admin_popup);
      selected_admins.unset_admin_hovered(admin_code);
      set_border(e);
    };
    var click = function(e) {
      // User has clicked an admin. Clear admin searched object.
      selected_admins.searched_admin_codes = {};
      selected_admins.select_admin(admin_code, set_border.bind(null, e));
      set_border(e);
      layer.bringToFront();  // Ensures border is fully visible.
    };
    layer.on({
      mousemove: mousemove,
      mouseover: mouseover,
      mouseout: mouseout,
      click: click
    });
  },

  /**
   * Refocus map to searched admin.
   *
   * @param{string} searched_admin_code - 3166-1 alpha-2 country code.
   * @param{object} feature - geofeature
   */
  refocus_map: function(searched_admin_code, feature) {
    var lat;
    var lon;
    if (searched_admin_code === feature.properties.admin_code) {
      if (feature.geometry.type.match(/MultiPolygon/)) {
        lon = feature.geometry.coordinates[0][0][0][0];
        lat = feature.geometry.coordinates[0][0][0][1];
      } else {
        lon = feature.geometry.coordinates[0][0][0];
        lat = feature.geometry.coordinates[0][0][1];
      }
      var thing = this;

      thing.map.setView(new L.LatLng(lat, lon), 7);
      // Hack so that refocus doesn't reoccur on redraw.
      this.selected_admins.fresh = false;
    }
  },

  get_admin_style_fcn: function() {
    var searched_admin_code = Object.keys(
      this.selected_admins.searched_admin_codes
    )[0];

    var admin_to_color_obj = this.map_coloring.active_base_layer_coloring_data();
    // When there's no base layer data, color all regions gray.
    var admin_to_color = function(admin_code) {
      return admin_to_color_obj[admin_code] || '#ccc';
    };
    var border_strength = function(admin_code, searched_admin_code, zoom) {
      if (admin_code === searched_admin_code) {return 1.0;}
      return zoom <= 5 ? 0.05 : 0.3;
    };

    return (function(feature) {
      var admin_code = feature.properties.admin_code;
      if (searched_admin_code) {
        // Center map on admin
        if (this.selected_admins.fresh) {
          this.refocus_map(searched_admin_code, feature);
        }
      }

      return {
        fillColor: admin_to_color(admin_code),
        fillOpacity: this.map_coloring.base_layer_opacity(),
        color: '#000',  // Border color.
        // Use lighter borders when zoomed out. Otherwise, the map looks very noisy in areas with
        // lots of little admins.
        opacity: border_strength(admin_code, searched_admin_code, this.map.getZoom()),
        weight: this.selected_admins.get_border_weight(admin_code)
      };
    }).bind(this);
  },

  create_epi_circle: function(admin_code, case_data) {
    var max_epi_marker_size_meters = 10000;
    // TODO(jetpack): scale by relative admin size for the country, or something?
    var radius_meters = max_epi_marker_size_meters *
        this.map_coloring.case_data_to_severity(case_data);
    var circle = L.circle(this.admin_code_to_latlng[admin_code], radius_meters, {
      weight: 1,
      opacity: 0.9,
      fillOpacity: 0.3
    });

    var circle_popup = L.popup(this.popup_options);
    var admin_name = this.admin_details.get_admin_properties(admin_code).name;
    circle_popup.setContent(
      '<b>' + admin_name + '</b><br/>' +
        this.map_coloring.case_data_to_display_strings(case_data).join('<br/>'));
    var map = this.map;
    // TODO(jetpack): clicks on the circle should behave the same as clicks on
    // the admin.
    circle.on({
      mousemove: function(e) {
        circle_popup.setLatLng(e.latlng);
        map.openPopup(circle_popup);
      },
      mouseout: function() { map.closePopup(circle_popup); }
    });

    return circle;
  },

  build_epi_overlay_layer: function(epi_data) {
    var layer_group = L.layerGroup();
    _.forEach(epi_data, (function(country_epi_data) {
      _.forEach(country_epi_data.admin_case_data, (function(case_data, admin_code) {
        layer_group.addLayer(this.create_epi_circle(admin_code, case_data));
      }).bind(this));
    }).bind(this));
    return layer_group;
  },

  // TODO(jetpack): finalize styling and weight function. and do we want a popup or something?
  build_mobility_overlay_layer: function(mobility_data) {
    var show_top_n = 30;
    var opacity_scale = d3.scale.log().domain([1, 100000]).clamp(true).range([0, 0.8]);
    var weight_scale = d3.scale.log().domain([1, 100000]).clamp(true).range([0, 5]);
    var layer_group = L.layerGroup();
    var admin_latlng = this.admin_code_to_latlng;
    console.log('build_mobility_overlay_layer data:', mobility_data);
    _.forEach(mobility_data, function(destination_counts, origin_admin) {
      var sorted_destination_counts = _.sortBy(
        obj_to_alist(destination_counts),
        // sort by descending count
        function(dest_and_count) { return -dest_and_count[1]; });
      var top_destination_counts = _.take(sorted_destination_counts, show_top_n);
      // console.log('BMOL. sorted, top:', sorted_destination_counts, top_destination_counts);
      _.forEach(top_destination_counts, function(dest_and_count) {
        var destination_admin = dest_and_count[0];
        var count = dest_and_count[1];
        if (!admin_latlng[origin_admin] || !admin_latlng[destination_admin]) {
          console.error('BUG: unknown admin?!', origin_admin, destination_admin);
        } else {
          var latlngs = [admin_latlng[origin_admin], admin_latlng[destination_admin]];
          var polyline = L.polyline(latlngs, {
            color: '#03f',
            weight: weight_scale(count),
            opacity: opacity_scale(count),
            clickable: false
          });
          layer_group.addLayer(polyline);
        }
      });
    });
    return layer_group;
  },

  redraw: function() {
    var style_fcn = this.get_admin_style_fcn();

    // Add/remove country layers. Update coloring.
    _.forEach(this.admins_layers_by_country, (function(layers, country) {
      var map = this.map;
      if (this.map_coloring.selected_countries.is_country_selected(country)) {
        layers.forEach(function(layer) {
          layer.setStyle(style_fcn);
          if (!map.hasLayer(layer)) {
            map.addLayer(layer);
          }
        });
      } else {
        layers.forEach(function(layer) {
          if (map.hasLayer(layer)) { map.removeLayer(layer); }
        });
      }
    }).bind(this));

    // Clear previous overlays.
    _.forEach(this.overlay_layers, (function(overlay_map_layer) {
      overlay_map_layer.clearLayers();
      this.map.removeLayer(overlay_map_layer);
    }).bind(this));
    this.overlay_layers = [];

    // Draw currently active overlays.
    _.forEach(this.map_coloring.active_overlay_data(), (function(overlay_data, overlay_name) {
      console.log('overlay data:', overlay_name, overlay_data);
      var overlay_layer;
      switch (overlay_name) {
        case 'epi':
          overlay_layer = this.build_epi_overlay_layer(overlay_data);
          break;
        case 'mobility':
          overlay_layer = this.build_mobility_overlay_layer(overlay_data);
          break;
        default:
          console.error('BUG! MapController does not support overlay type:', overlay_name);
      }
      overlay_layer.addTo(this.map);
      this.overlay_layers.push(overlay_layer);
    }).bind(this));
  },

  /**
   * Loads a chunk of polygon features. This makes it so we don't tie up the UI threads.
   *
   * @param{string} country_code -- country code corresponding to the feature
   * @param{array} features -- list of GeoJSON features
   */
  load_feature_chunk: function(country_code, features) {
    var feature_collection = {type: 'FeatureCollection', features: features};
    var admins_layer = L.geoJson(
      feature_collection,
      {
        onEachFeature: this.on_each_feature.bind(this),
        style: this.get_admin_style_fcn()
      }
    );
    this.map.addLayer(admins_layer);
    var admins_layers = this.admins_layers_by_country[country_code] || [];
    admins_layers.push(admins_layer);
    this.admins_layers_by_country[country_code] = admins_layers;
  },

  /**
   * Adds polygons to map. This is done later, so that we can
   * show the initial map to the user first.
   */
  post_initial_load: function() {
    var distance_fcn = make_distance_from_viewport_center(this.map.getBounds());
    // TODO(jetpack): probably makes more sense to do this just once with all selected countries'
    // polygons rather than once per country.
    var add_country = (function(country_code) {
      var features_by_distance = _.sortBy(this.admin_details.get_geojson_features(country_code),
                                          distance_fcn);
      this.load_feature_chunk(country_code, _.take(features_by_distance, 500));
      this.loading_status.set_initialized_topojson();

      var sequence = Q();
      _.forEach(_.chunk(_.drop(features_by_distance, 500), 2500), (function(chunk) {
        sequence = sequence.delay(10).then(this.load_feature_chunk.bind(this, country_code, chunk));
      }).bind(this));

      sequence.fail(function(err) { console.error(err); });
    }).bind(this);
    this.map_coloring.selected_countries.get_selected_countries().forEach(add_country);
  }
});

module.exports = MapController;
