/**
 * Represents whether the file is loading.
 */

var P = require('pjs').P;

var LoadingStatusModel = P({
  init: function(onUpdate) {
    this.status = 'loading base map';
    this.is_loading = true;
    this.onUpdate = onUpdate;  // callback to update views
  },

  setLoadedBase: function() {
    this.is_loading = false;
  },

  setLoadedTopojson: function() {
    this.is_loading = false;
    this.onUpdate();
  }
});

module.exports = LoadingStatusModel;
