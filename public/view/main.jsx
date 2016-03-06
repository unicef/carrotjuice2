/**
 * this is the main entrypoint for our single-page app
 */
var React = require('react');

// Views
var DateSelectionBar = require('./date-selection-bar.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var LoadingStatusView = require('./loading-status.jsx');
var OverlayControlsBox = require('./overlay-controls-box.jsx');
var ViewUtil = require('./view-util.jsx');

// Models
var DataLayer = require('../model/data-layer.js');
var LoadingStatusModel = require('../model/loading-status.js');
var WeatherDataStore = require('../model/weather-data-store.js');
var SelectedDate = require('../model/selected-date.js');

// Controllers & other data-managing classes
var APIClient = require('../api-client/api-client.js');
var MapController = require('../map-controller/map-controller.js');

// module-local style
require('./main.css');

// callback to re-render the main view. we need a little bit of
// ugliness here because AppMain hasn't yet been instantiated.
var main_instance = null;
var rerender = function() {
  if (main_instance !== null) {
    main_instance.forceUpdate();
  }
};

var loading_status = LoadingStatusModel(rerender);
var data_layer = DataLayer(rerender);
var api_client = APIClient('br');
var weather_data_store = WeatherDataStore(api_client);
var map_controller = MapController(api_client, loading_status, data_layer);
var selected_date = SelectedDate(rerender, weather_data_store);

var AppMain = React.createClass({
  render: function() {
    main_instance = this;
    return (
      <div className="mainContainer">
        {ViewUtil.flexbox_stack([
          <LeafletMap key="1" controller={map_controller} />,
          <DateSelectionBar key="2" selected_date={selected_date} />
        ])}
        <OverlayControlsBox data_layer={data_layer} />
        <LoadingStatusView model={loading_status} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
