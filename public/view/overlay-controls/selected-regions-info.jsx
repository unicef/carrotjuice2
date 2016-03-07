var React = require('react');
require('./selected-regions-info.css');

var SelectedRegionsInfo = React.createClass({
  render: function() {
    return <div className="selected-regions-info">
      {JSON.stringify(this.props.selected_regions.get_selected_regions())}
    </div>;
  }
});

module.exports = SelectedRegionsInfo;
