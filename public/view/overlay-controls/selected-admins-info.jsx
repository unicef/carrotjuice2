var React = require('react');
var _ = require('lodash');

require('./selected-admins-info.css');

var SelectedAdminsInfo = React.createClass({
  create_case_data: function(admin) {
    var epi_display_strings = this.props.admin_details.get_epi_data_display_strings(
      this.props.selected_date.current_day, admin.admin_code);
    if (epi_display_strings) {
      return <div className="selected-region-info-epi-data">
        {epi_display_strings.map(function(s, i) { return <div key={i}>{s}</div>; })}
      </div>;
    } else {
      return <em>No data avilable.</em>;
    }
  },

  create_admin_panel: function(admin) {
    // TODO(jetpack): remove area and add population, weather data, and mosquito data.
    return <div className="selected-admin-info" key={admin.name}>
      <h3>{admin.name}</h3>
      <div>Area: {admin.geo_area_sqkm} km²</div>
      <div>Case data: {this.create_case_data(admin)}</div>
    </div>;
  },

  render: function() {
    var selected_admins_data = this.props.admin_details.get_selected_admins_data();
    if (_.isEmpty(selected_admins_data)) {
      return <div className="selected-admins-info">
      <p className="selected-admins-help">
        Click an administrative region for more data.
      </p>
      </div>;
    } else {
      return <div className="selected-admins-info">
      {selected_admins_data.map(this.create_admin_panel)}
      </div>;
    }
  }
});

module.exports = SelectedAdminsInfo;
