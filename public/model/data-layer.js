/**
 * Which map layer the user is interacting with.
 */

var P = require('pjs').P;

var DataLayer = P({
  init: function(onUpdate) {
    this.data_layer = 'weather';
    this.onUpdate = onUpdate;  // typically, view re-rendering callback
  },

  set_layer: function(layer) {
    this.data_layer = layer;
    this.onUpdate();
  },

  get_valid_layers: function() {
    return ["weather", "oviposition", "population_density"];
  },

  display_name: function(layer_name) {
    return {
      weather: "Weather",
      oviposition: "Mosquito Oviposition",
      population_density: "Population Density"
    }[layer_name];
  }
});

module.exports = DataLayer;
