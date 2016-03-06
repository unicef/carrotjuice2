var L = require('leaflet');
var React = require('react');
require('./leaflet-map.css');
// set in the didMount call
var leaflet_map_element = null;

var LeafletMap = React.createClass({
  render: function() {
    return <div id="leaflet-map"></div>
  },
  componentDidMount: function() {
    var leaflet_map = document.getElementById("leaflet-map");
    console.log(leaflet_map);
  }
});

module.exports = LeafletMap;
