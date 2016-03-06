// this is the main entrypoint for our single-page app
var React = require('react');
var OverlayControlsBox = require('./overlay-controls-box.jsx');
var LeafletMap = require('./leaflet-map.jsx');
var LoadingStatusModel = require('../model/loading-status.js');
var LoadingStatusView = require('./loading-status.jsx');
var MapController = require('../map-controller/map-controller.js');
var APIClient = require('../api-client/api-client.js');
var DataLayer = require('../model/data-layer.js');

// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

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
var map_controller = MapController(api_client, loading_status, data_layer);

var AppMain = React.createClass({
  render: function() {
    main_instance = this;
    return (
      <div className="mainContainer">
        <LeafletMap controller={map_controller} />
        <OverlayControlsBox data_layer={data_layer} />
        <LoadingStatusView model={loading_status} />
      </div>
    );
  }
});

module.exports = {AppMain: AppMain};
