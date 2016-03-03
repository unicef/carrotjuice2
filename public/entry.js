var d3 = require('../bower_components/d3/d3.js');
var React = require('react');
var ReactDOM = require('react/react-dom.js');

var mainViews = require('./view/main.jsx');

ReactDOM.render(
  React.createElement(mainViews.AppMain, null),
  document.getElementById("main-content")
);
