// this is the main entrypoint for our single-page app
var React = require('react');
var OverlayControlsBox = require('./overlay-controls-box.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var MapController = require('../map-controller/map-controller.js');
var P = require('pjs');

// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

// module-local style
require('./main.css');

var map_controller = MapController();

var AppMain = React.createClass({
  render: function() {
    return (
      <div className="mainContainer">
        <LeafletMap controller={map_controller} />
        <OverlayControlsBox />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
