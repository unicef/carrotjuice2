// this is the main entrypoint for our single-page app
var React = require('react');
var DemoInputBox = require('./demo-input-box.jsx');
var InputBoxModel = require('../model/demo-input-box-model');
require('./main.css');

var myModel = new InputBoxModel();

var AppMain = React.createClass({
  render: function() {
    return (
      <div className="mainContainer">
        Hello World from JSX!
        <DemoInputBox model={myModel} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
