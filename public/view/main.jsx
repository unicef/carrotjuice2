// this is the main entrypoint for our single-page app
var React = require('react');
var OverlayControlsBox = require('./overlay-controls-box.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var P = require('pjs');

// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

// module-local style
require('./main.css');

var AppMain = React.createClass({
  render: function() {
    return (
      <div className="mainContainer">
        <LeafletMap />
        <OverlayControlsBox />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
