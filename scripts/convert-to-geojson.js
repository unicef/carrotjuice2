/**
 * Experiment to convert TopoJSON back to GeoJSON. Mostly
 * abandoned.
 *
 * node scripts/convert-to-geojson.js > public/back_to_geojson_br.geo.json
 * gz_size public/back_to_geojson_br.geo.json
 3.9MiB - public/back_to_geojson_br.geo.json (uncompressed: 15MiB)
 *
 * NOTE: gz_size is my shell alias, but it does what you think.
 */
var _ = require('lodash');
var topojson = require('topojson');
var fs = require('fs');

var data = JSON.parse(
  fs.readFileSync("public/admin_polygons_br.topo.json"));
var features = _.map(data.objects, function(datum) {
  return topojson.feature(data, datum);
});
console.log(JSON.stringify(features));
