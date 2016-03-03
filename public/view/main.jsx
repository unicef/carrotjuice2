// this is the main entrypoint for our single-page app
var React = require('../../bower_components/react/react.js');

var AppMain = React.createClass({
  render: function() {
    return (<div>Hello World from JSX!</div>);
  }
});

module.exports = {AppMain: AppMain};
