var React = require('react');
require('./selected-regions-info.css');

var SelectedRegionsInfo = React.createClass({
  create_region_panel: function(region) {
    return <div className="selected-region-info" key={region.region_code}>
      <div className="selected-region-name">{region.name}</div>
      <div className="selected-region-code">{region.region_code}</div>
      <div className="selected-region-area">{region.geo_area_sqkm}</div>
    </div>;
  },

  render: function() {
    var selected_regions_data = this.props.region_details.get_selected_regions_data();
    return <div className="selected-regions-info">
      {selected_regions_data.map(this.create_region_panel)}
    </div>;
  }
});

module.exports = SelectedRegionsInfo;
