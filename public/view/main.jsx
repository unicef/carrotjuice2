/**
 * this is the main entrypoint for our single-page app
 */
var React = require('react');

// Views
var DateSelectionBar = require('./date-selection-bar.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var LoadingStatusView = require('./loading-status.jsx');
var OverlayControlsBox = require('./overlay-controls/overlay-controls-box.jsx');
var ViewUtil = require('./view-util.jsx');

// Models
var DataLayer = require('../model/data-layer.js');
var LoadingStatusModel = require('../model/loading-status.js');
var WeatherDataStore = require('../model/weather-data-store.js');
var SelectedDate = require('../model/selected-date.js');
var SelectedRegions = require('../model/selected-regions.js');
var RegionDetails = require('../model/region-details.js');
var MapColoring = require('../model/map-coloring.js');

// Controllers & other data-managing classes
var APIClient = require('../api-client/api-client.js');
var MapController = require('../map-controller/map-controller.js');

// module-local style
require('./main.css');

// callback to re-render the main view. we need a little bit of
// ugliness here because AppMain hasn't yet been instantiated.
var main_instance = null;
var map_controller = null;
var rerender = function() {
  if (main_instance !== null) {
    main_instance.forceUpdate();
  }
};
var rerender_and_redraw = function() {
  rerender();
  if (map_controller !== null) {
    map_controller.redraw();
  }
};

// NOTE: we could model resize state formally, but this'll do for now
window.addEventListener('resize', rerender);

var loading_status = LoadingStatusModel(rerender);
var api_client = APIClient('br');
var weather_data_store = WeatherDataStore(api_client);
var data_layer = DataLayer(rerender_and_redraw);
var selected_date = SelectedDate(rerender_and_redraw, weather_data_store);
var selected_regions = SelectedRegions(function() {
  rerender();
  weather_data_store.on_region_select(selected_regions.get_region_codes());
});
var region_details = RegionDetails(rerender, api_client, selected_regions, weather_data_store);
var map_coloring = MapColoring({
  data_layer: data_layer,
  selected_date: selected_date,
  weather_data_store: weather_data_store
});
map_controller = MapController(loading_status, region_details, selected_regions, map_coloring);

var AppMain = React.createClass({
  render: function() {
    main_instance = this;
    return (
      <div className="mainContainer">
        {ViewUtil.flexbox_stack([
          <LeafletMap key="1" controller={map_controller} />,
          <DateSelectionBar key="2" selected_date={selected_date} />
        ])}
        <OverlayControlsBox data_layer={data_layer} region_details={region_details} />
        <LoadingStatusView model={loading_status} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
