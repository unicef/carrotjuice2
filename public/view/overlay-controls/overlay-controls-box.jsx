var React = require('react');
var DataSourceSelector = require('./data-source-selector.jsx');
require('./overlay-controls-box.css');

var OverlayControlsBox = React.createClass({
  render: function() {
    return <div className="overlay-controls-box">
      <h3>Zika Risk Mapping</h3>
      <div style={{paddingTop: "5px"}}>
        <strong>Data source</strong>:
        <DataSourceSelector
          data_layer={this.props.data_layer}
        />
      </div>
    </div>;
  }
});

module.exports = OverlayControlsBox;
