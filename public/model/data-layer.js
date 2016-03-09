/**
 * Which map layers the user is interacting with.
 *
 * There are 2 types of layers:
 * - A single "base" layer that controls the majority of the display (e.g., map coloring).
 * - A list of toggleable "overlay" layers that add on more information (e.g.,
 *   mobility or epidemiological data).
 */

var _ = require('lodash');
var P = require('pjs').P;

var DataLayer = P({
  init: function(on_update) {
    this.on_update = on_update;
    this.base_layer = 'weather';
    // `overlay_layers_status` is a map from all available overlays to a boolean
    // indicating whether layer is active.
    this.overlay_layers_status = {
      epi: false,
      mobility: false
    };
  },

  set_base_layer: function(base_layer) {
    this.base_layer = base_layer;
    this.on_update();
  },

  toggle_overlay_layer: function(overlay_layer) {
    this.overlay_layers_status[overlay_layer] = !this.overlay_layers_status[overlay_layer];
    this.on_update();
  },

  get_available_base_layers: function() {
    return ['weather', 'oviposition', 'population_density'];
  },

  get_available_overlay_layers: function() {
    return _.keys(this.overlay_layers_status);
  },

  // TODO(jetpack): unit test that all valid layers return a name.
  display_name: function(layer_name) {
    return {
      weather: 'Weather',
      oviposition: 'Mosquito Oviposition',
      population_density: 'Population Density',
      epi: 'Epidemiological',
      mobility: 'Mobility'
    }[layer_name];
  }
});

module.exports = DataLayer;
