var React = require('react');
var DataSourceSelector = require('./data-source-selector.jsx');
var SelectedRegionsInfo = require('./selected-regions-info.jsx');
require('./overlay-controls-box.css');

var OverlayControlsBox = React.createClass({
  render: function() {
    return <div className="overlay-controls">
      <div className="overlay-controls-section">
        <SelectedRegionsInfo
            region_details={this.props.region_details}
        />
      </div>
      <div className="overlay-controls-section">
        <DataSourceSelector
          data_layer={this.props.data_layer}
        />
      </div>
    </div>;
  }
});

module.exports = OverlayControlsBox;
