/**
 * Just defines Leaflet basemaps (map tiles)
 *
 * @type {*} object
 */
var L = require('leaflet');

var esri_url = function(basemap_name) {
  return 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
    basemap_name + '/MapServer/tile/{z}/{y}/{x}';
};

/* eslint-disable max-len */
module.exports = {
  'CartoDB': L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }),
  'ESRI Gray': L.tileLayer(esri_url('Canvas/World_Light_Gray_Base'), {
    attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=149a9bb14d604bd18f4597b21c19fac7">ESRI</a>'
  }),
  'ESRI Streets': L.tileLayer(esri_url('World_Street_Map'), {
    attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=8bf7167d20924cbf8e25e7b11c7c502c">ESRI</a>'
  }),
  'ESRI Imagery': L.tileLayer(esri_url('World_Imagery'), {
    attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=a2e7c99be14d421abac4f002d6c301f5">ESRI</a>'
  }),
  'OSM Transit': L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://thunderforest.com/">Thunderforest</a>'
  }),
  'OpenStreetMap': L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })
};
/* eslint-enable max-len */
