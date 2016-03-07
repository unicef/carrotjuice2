// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

// pull in global leaflet styling
require('leaflet/dist/leaflet.css');

var React = require('react');
var ReactDOM = require('react-dom');

var mainViews = require('./view/main.jsx');

ReactDOM.render(
  React.createElement(mainViews.AppMain, null),
  document.getElementById("main-content")
);
