/**
 * this is the main entrypoint for our single-page app
 */
var _ = require('lodash');
var React = require('react');

// Views
var DateSelectionBar = require('./date-selection-bar.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var LoadingStatusView = require('./loading-status.jsx');
var OverlayControlsBox = require('./overlay-controls/overlay-controls-box.jsx');
var ViewUtil = require('./view-util.jsx');

// Events
var SearchAdminEvent = require('../event-emitters/search-admin-event.js');
var SelectAdminEvent = require('../event-emitters/select-admin-event.js');

// Models
var SelectedLayers = require('../model/selected-layers.js');
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
var _base_rerender = function() {
  if (main_instance !== null) {
    main_instance.forceUpdate();
  }
};
var rerender = _.debounce(_base_rerender, 16);  // 16 milliseconds is 60 frames per second ... fast enough
var rerender_and_redraw = _.debounce(function() {
  _base_rerender();
  if (map_controller !== null) {
    map_controller.redraw();
  }
}, 16);

// NOTE: we could model resize state formally, but this'll do for now
window.addEventListener('resize', rerender);

var loading_status = new LoadingStatusModel();
var api_client = new APIClient(loading_status);
var epi_data_store = new EpiDataStore();
var econ_data_store = new EconDataStore();
var mobility_data_store = new MobilityDataStore(api_client);
var weather_data_store = new WeatherDataStore(api_client, SUPPORTED_COUNTRIES);
var selected_layers = new SelectedLayers();
var selected_countries = new SelectedCountries(SUPPORTED_COUNTRIES);
var selected_date = new SelectedDate(weather_data_store);
var selected_admins = new SelectedAdmins();

loading_status.emitter.any_event_listener(rerender);
epi_data_store.emitter.any_event_listener(rerender_and_redraw);
econ_data_store.emitter.any_event_listener(rerender_and_redraw);
mobility_data_store.emitter.any_event_listener(rerender_and_redraw);
weather_data_store.emitter.any_event_listener(rerender_and_redraw);

// Upon selection, we may want to fetch more data from the server. This code is a
// little out-of-band, because when one dimension is changed/selectied (e.g. admin
// regions), we also want to know about the current date so we only fetch data with
// the relevant date.
//
// TODO: Move this code to a more appropriate file?
// TODO(jetpack): for all of these, we'll want a similar thing for epi_data_store?
selected_layers.emitter.any_event_listener(rerender_and_redraw);
selected_countries.emitter.any_event_listener(function(action) {
  weather_data_store.on_country_select(
    action.selected_country_codes,
    selected_date.current_day
  );
  rerender();
});
selected_admins.emitter.add_listener(SearchAdminEvent, function(action) {
  map_controller.on_admin_search(action.searched_admin_codes);
  rerender();
});
selected_admins.emitter.add_listener(SelectAdminEvent, function(action) {
  mobility_data_store.on_select(action.selected_admins, selected_date.current_day);
  weather_data_store.on_admin_select(action.selected_admins);
  rerender();
});
selected_date.emitter.any_event_listener(function(action) {
  mobility_data_store.on_select(selected_admins.get_admin_codes(), action.selected_date);
  weather_data_store.on_date_select(
    selected_countries.get_selected_countries(), action.selected_date
  );
  rerender();
});

var admin_details = new AdminDetails({
  api_client: api_client,
  selected_admins: selected_admins,
  econ_data_store: econ_data_store,
  epi_data_store: epi_data_store,
  weather_data_store: weather_data_store,
  initial_countries_to_load: SUPPORTED_COUNTRIES
});
var map_coloring = new MapColoring({
  selected_layers: selected_layers,
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
  map_coloring: map_coloring,
  focus: [-23.3, -46.3]   // São Paulo.
});

var AppMain = React.createClass({
  render: function() {
    main_instance = this;
    return (
      <div className="mainContainer">
        {ViewUtil.flexbox_stack([
          <div key="1" style={{flexGrow: 1, position: 'relative'}}>
            <LeafletMap controller={map_controller} />
            <LoadingStatusView model={loading_status} />
          </div>,
          <DateSelectionBar key="2"
                            selected_date={selected_date}
                            selected_admins={selected_admins}
                            weather_data_store={weather_data_store} />
        ])}
        <OverlayControlsBox selected_layers={selected_layers}
                            selected_countries={selected_countries}
                            selected_date={selected_date}
                            admin_details={admin_details} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
