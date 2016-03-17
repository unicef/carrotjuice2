var React = require('react');
var _ = require('lodash');

require('./selected-admins-info.css');

var SelectedAdminsInfo = React.createClass({
  no_data: <em>No data.</em>,

  commify: function(i) {
    return i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  population_figure: function(x) {
    if (!x) { return this.no_data; }
    return this.commify(parseInt(x, 10));
  },

  create_case_data: function(admin_code) {
    var epi_display_strings = this.props.admin_details.get_epi_data_display_strings(
      admin_code, this.props.selected_date.current_day);
    if (epi_display_strings) {
      return <div className="selected-region-info-epi-data">
        {epi_display_strings.map(function(s, i) { return <div key={i}>{s}</div>; })}
      </div>;
    } else {
      return this.no_data;
    }
  },

  create_admin_panel: function(admin) {
    // TODO(jetpack): add weather, mosquito data. probably remove area?
    return <div className="selected-admin-info" key={admin.name}>
      <h3>{admin.name}</h3>
      <div>Population: {this.population_figure(admin.population)}</div>
      <div>Area: {this.commify(Math.round(admin.geo_area_sqkm))} km²</div>
      <div>Case data: {this.create_case_data(admin.admin_code)}</div>
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
