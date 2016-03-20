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
var EpiDataStore = require('../model/epi-data-store.js');
var EconDataStore = require('../model/econ-data-store.js');
var MobilityDataStore = require('../model/mobility-data-store.js');
var WeatherDataStore = require('../model/weather-data-store.js');
var SelectedCountries = require('../model/selected-countries.js');
var SelectedAdmins = require('../model/selected-admins.js');
var SelectedDate = require('../model/selected-date.js');
var AdminDetails = require('../model/admin-details.js');
var MapColoring = require('../model/map-coloring.js');

// Controllers & other data-managing classes
var APIClient = require('../api-client/api-client.js');
var MapController = require('../map-controller/map-controller.js');

// module-local style
require('./main.css');

const SUPPORTED_COUNTRIES = ['br', 'co', 'pa'];

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

var loading_status = new LoadingStatusModel(rerender);
var api_client = new APIClient();
var epi_data_store = new EpiDataStore(rerender_and_redraw);
var econ_data_store = new EconDataStore(rerender_and_redraw);
var mobility_data_store = new MobilityDataStore(rerender_and_redraw, api_client);
var weather_data_store = new WeatherDataStore(rerender_and_redraw, api_client, SUPPORTED_COUNTRIES);
var data_layer = new DataLayer(rerender_and_redraw);
// ugliness because the on_update callbacks for both `selected_date` and `selected_countries`
// require a reference to both.
var selected_date = null;
var selected_countries = new SelectedCountries(function() {
  console.log('selected countries changed, rerender...');
  rerender();
  weather_data_store.on_country_select(selected_countries.get_selected_countries(),
                                       selected_date.current_day);
}, SUPPORTED_COUNTRIES);
selected_date = new SelectedDate(function() {
  rerender();
  mobility_data_store.on_select(selected_admins.get_admin_codes(), selected_date.current_day);
  // TODO(jetpack): we'll want a similar thing for epi_data_store, I think?
  weather_data_store.on_date_select(selected_countries.get_selected_countries(),
                                    selected_date.current_day);
}, weather_data_store);
var selected_admins = new SelectedAdmins(function() {
  rerender();
  mobility_data_store.on_select(selected_admins.get_admin_codes(), selected_date.current_day);
  // TODO(jetpack): we'll want a similar thing for epi_data_store, I think?
  weather_data_store.on_admin_select(selected_admins.get_admin_codes());
});
var admin_details = new AdminDetails({
  on_update: rerender,
  api_client: api_client,
  selected_admins: selected_admins,
  econ_data_store: econ_data_store,
  epi_data_store: epi_data_store,
  weather_data_store: weather_data_store,
  initial_countries_to_load: SUPPORTED_COUNTRIES
});
var map_coloring = new MapColoring({
  data_layer: data_layer,
  selected_admins: selected_admins,
  selected_date: selected_date,
  selected_countries: selected_countries,
  admin_details: admin_details,
  weather_data_store: weather_data_store,
  epi_data_store: epi_data_store,
  mobility_data_store: mobility_data_store
});
map_controller = new MapController({
  loading_status: loading_status,
  admin_details: admin_details,
  selected_admins: selected_admins,
  map_coloring: map_coloring
});

var AppMain = React.createClass({
  render: function() {
    main_instance = this;
    return (
      <div className="mainContainer">
        {ViewUtil.flexbox_stack([
          <LeafletMap key="1" controller={map_controller} />,
          <DateSelectionBar key="2"
                            selected_date={selected_date}
                            selected_admins={selected_admins}
                            weather_data_store={weather_data_store} />
        ])}
        <OverlayControlsBox data_layer={data_layer}
                            selected_countries={selected_countries}
                            selected_date={selected_date}
                            admin_details={admin_details} />
        <LoadingStatusView model={loading_status} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
