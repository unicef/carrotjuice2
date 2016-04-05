var React = require('react');
var AdminSearch = require('./admin-search.jsx');
var CountrySelector = require('./country-selector.jsx');
var DataSourceSelector = require('./data-source-selector.jsx');
var SelectedAdminsInfo = require('./selected-admins-info.jsx');
require('./overlay-controls-box.css');

var OverlayControlsBox = React.createClass({
  render: function() {
    return <div className="overlay-controls">
      <div className="overlay-controls-section">
        <CountrySelector
            selected_countries={this.props.selected_countries}
        />
      </div>
      <div className="overlay-controls-section">
        <SelectedAdminsInfo
            selected_date={this.props.selected_date}
            admin_details={this.props.admin_details}
        />
      </div>
      <div className="overlay-controls-section">
        <DataSourceSelector
          selected_layers={this.props.selected_layers}
        />
      </div>
      <br/>
      <br/>
      <div className="overlay-controls-section">
        <AdminSearch
          admin_details={this.props.admin_details}
          selected_countries={this.props.selected_countries}
        />
      </div>
    </div>;
  }
});

module.exports = OverlayControlsBox;
