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
var DependencyGraph = require('../singleton-dependency-injection.js');
var APIClient = require('../api-client/api-client.js');
var MapController = require('../map-controller/map-controller.js');

// module-local style
require('./main.css');

const SUPPORTED_COUNTRIES = ['br', 'co', 'pa'];

var models_graph = new DependencyGraph();

// NOTE: main_view is a manually-provided instance, set when we get the injector below.
models_graph.add('rerender', ['main_view'], function(main_view) {
  return main_view.forceUpdate.bind(main_view);
});
models_graph.add('rerender_and_redraw', ['rerender'], function(rerender, injector) {
  return function() {
    rerender();
    injector.instance('map_controller').redraw();
  };
});
models_graph.add_constant('SUPPORTED_COUNTRIES', SUPPORTED_COUNTRIES);

models_graph.add('api_client', [], APIClient);
models_graph.add('loading_status', ['rerender'], LoadingStatusModel);

// data stores
models_graph.add('epi_data_store', ['rerender_and_redraw'], EpiDataStore);
models_graph.add(
  'weather_data_store',
  ['rerender_and_redraw', 'api_client', 'SUPPORTED_COUNTRIES'],
  WeatherDataStore
);
models_graph.add('econ_data_store', ['rerender_and_redraw'], EconDataStore);
models_graph.add(
  'mobility_data_store',
  ['rerender_and_redraw', 'api_client'],
  MobilityDataStore
);

// UI state models
models_graph.add('data_layer', ['rerender_and_redraw'], DataLayer);
models_graph.add(
  'selected_countries',
  ['weather_data_store', 'rerender'],
  function(weather_data_store, rerender, injector) {
    return new SelectedCountries(function() {
      rerender();
      weather_data_store.on_country_select(
        injector.instance('selected_countries').get_selected_countries(),
        injector.instance('selected_date').current_day);
    }, SUPPORTED_COUNTRIES);
  }
);
models_graph.add(
  'selected_date',
  ['rerender', 'weather_data_store', 'mobility_data_store'],
  function(rerender, weather_data_store, mobility_data_store, injector) {
    return new SelectedDate(function() {
      rerender();
      // TODO(jetpack): we'll want a similar thing for epi_data_store, I think?
      mobility_data_store.on_select(
        injector.instance('selected_admins').get_admin_codes(),
        injector.instance('selected_date').current_day
      );
      weather_data_store.on_date_select(
        injector.instance('selected_countries').get_selected_countries(),
        injector.instance('selected_date').current_day);
    }, weather_data_store);
  }
);
models_graph.add(
  'selected_admins',
  ['rerender', 'weather_data_store', 'mobility_data_store'],
  function(rerender, weather_data_store, mobility_data_store, injector) {
    return new SelectedAdmins(function() {
      rerender();
      // TODO(jetpack): we'll want a similar thing for epi_data_store, I think?
      mobility_data_store.on_select(
        injector.instance('selected_admins').get_admin_codes(),
        injector.instance('selected_date').current_day
      );
      weather_data_store.on_admin_select(
        injector.instance('selected_admins').get_admin_codes()
      );
    });
  }
);

// higher-level models, combining multiple other models

models_graph.add(
  'admin_details',
  [
    'rerender',
    'api_client',
    'selected_admins',
    'epi_data_store',
    'weather_data_store',
    'SUPPORTED_COUNTRIES'
  ],
  AdminDetails
);
models_graph.add(
  'map_coloring',
  [
    'data_layer',
    'selected_admins',
    'selected_date',
    'selected_countries',
    'admin_details',
    'weather_data_store',
    'econ_data_store',
    'epi_data_store',
    'mobility_data_store'
  ],
  MapColoring
);
models_graph.add(
  'map_controller',
  [
    'loading_status',
    'admin_details',
    'selected_admins',
    'map_coloring'
  ],
  MapController
);

var AppMain = React.createClass({
  getInitialState: function() {
    var injector = models_graph.injector({main_view: this});
    // NOTE: we could model resize state formally, but this'll do for now
    window.addEventListener('resize', injector.instance('rerender'));
    return {injector: injector};
  },

  render: function() {
    var i = this.state.injector;  // alias
    return (
      <div className="mainContainer">
        {ViewUtil.flexbox_stack([
          <LeafletMap key="1" controller={i.instance('map_controller')}/>,
          <DateSelectionBar key="2"
                            selected_date={i.instance('selected_date')}
                            selected_admins={i.instance('selected_admins')}
                            weather_data_store={i.instance('weather_data_store')}/>
        ])}
        <OverlayControlsBox data_layer={i.instance('data_layer')}
                            selected_countries={i.instance('selected_countries')}
                            selected_date={i.instance('selected_date')}
                            admin_details={i.instance('admin_details')}/>
        <LoadingStatusView model={i.instance('loading_status')}/>
      </div>
    );
  }
});

module.exports = {
  models_graph: models_graph,
  AppMain: AppMain
};
