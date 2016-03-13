var React = require('react');
var DataSourceSelector = require('./data-source-selector.jsx');
var SelectedAdminsInfo = require('./selected-admins-info.jsx');
require('./overlay-controls-box.css');

var OverlayControlsBox = React.createClass({
  render: function() {
    return <div className="overlay-controls">
      <div className="overlay-controls-section">
        <SelectedAdminsInfo
            selected_date={this.props.selected_date}
            admin_details={this.props.admin_details}
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
