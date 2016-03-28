var React = require('react');
var _ = require('lodash');

require('./selected-admins-info.css');

var SelectedAdminsInfo = React.createClass({
  no_data: <em>No data.</em>,

  commify: function(i) {
    return Math.round(i).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  population_figure: function(x) {
    if (!x) { return this.no_data; }
    return this.commify(x);
  },

  weather_data: function(admin_code) {
    var weather_data = this.props.admin_details.weather_data_store.weather_data_for_date_and_admin(
      this.props.selected_date.current_day, admin_code);
    if (_.has(weather_data, 'temp_mean')) {
      return <span>{weather_data.temp_mean.toFixed(1)} °C</span>;
    } else {
      return this.no_data;
    }
  },

  case_data: function(admin_code) {
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
    // TODO(jetpack): add mosquito data. probably remove area?
    return <div className="selected-admin-info" key={admin.name}>
      <h3>{admin.name}</h3>
      <div>Population: {this.population_figure(admin.population)}</div>
      <div>Area: {this.commify(admin.geo_area_sqkm)} km²</div>
      <div>Weather: {this.weather_data(admin.admin_code)}</div>
      <div>Case data: {this.case_data(admin.admin_code)}</div>
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
