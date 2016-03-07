var React = require('react');
require('./selected-regions-info.css');

var SelectedRegionsInfo = React.createClass({
  create_region_panel: function(region) {
    // TODO(jetpack): remove area and add population, weather data, and mosquito data.
    return <div className="selected-region-info" key={region.name}>
      <h3>{region.name}</h3>
      <p>Area: {region.geo_area_sqkm} km²</p>
    </div>;
  },

  render: function() {
    var selected_regions_data = this.props.region_details.get_selected_regions_data();
    if (selected_regions_data.length) {
      return <div className="selected-regions-info">
        {selected_regions_data.map(this.create_region_panel)}
      </div>;
    } else {
      return <div className="selected-regions-info">
        <p className="selected-regions-help">
          Click an administrative region for more data.
        </p>
      </div>;
    }
  }
});

module.exports = SelectedRegionsInfo;
