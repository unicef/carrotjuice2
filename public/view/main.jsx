// this is the main entrypoint for our single-page app
var React = require('react');
var DemoInputBox = require('./demo-input-box.jsx');
var InputBoxModel = require('../model/demo-input-box-model');
var OverlayControlsBox = require('./overlay-controls-box.jsx');

// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery/dist/jquery.js');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

// module-local style
require('./main.css');

var myModel = new InputBoxModel();

var AppMain = React.createClass({
  render: function() {
    return (
      <div className="mainContainer">
        <OverlayControlsBox />
        Hello World from JSX!
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
