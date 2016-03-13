var React = require('react');
require('./leaflet-map.css');

var LeafletMap = React.createClass({
  render: function() {
    return <div id="leaflet-map"></div>;
  },
  componentDidMount: function() {
    var leaflet_map = document.getElementById("leaflet-map");
    this.props.controller.initialize(leaflet_map);
  }
});

module.exports = LeafletMap;
