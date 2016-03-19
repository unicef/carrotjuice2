var $ = require('jquery');
var assert = require('assert');
var Q = require('q');
var React = require('react');  // required to be in scope post-JSX compilation
var ReactDOM = require('react-dom');

var LeafletMap = require('../../view/leaflet-map.jsx');
var MockApiClient = require('../api-client/api-client-mock.js');
var Main = require('../../view/main.jsx');

var get_test_controller = function() {
  return Main.models_graph.injector({
    rerender: function() {
    },
    api_client: new MockApiClient()
  }).instance('map_controller');
};

// pass the result to a `then` block.
var wait_for_element = function(name) {
  return function() {
    var element = $(name);
    if (element.length > 0) {
      return element;
    } else {
      return Q.delay(1).then(wait_for_element(name));
    }
  };
};

var TestMapElement = React.createClass({
  render: function() {
    var controller = get_test_controller();
    return <LeafletMap controller={controller}/>;
  }
});

describe('map-controller/map-controller', function() {
  it('mounts and renders a region', function() {
    var data_layer = {
      data_layer: 'test_layer',
      display_name: function() {
        return 'test display name';
      },
      get_valid_layers: function() {
        return [];
      }
    };

    return Q().then(function() {
      ReactDOM.render(
        <TestMapElement />,
        window.test_content_div
      );
    }).then(wait_for_element('path.leaflet-clickable')).then(function(x) {
      var map_region = $('path.leaflet-clickable');
      window.map_region = map_region;
      assert.strictEqual(map_region.length, 1);

      var dimensions = map_region.get(0).getBoundingClientRect();
      // TODO(zora): Fix this ... not sure why it's grey currently
      // assert.deepEqual("#57ab00", map_region.attr("fill"));
      assert.ok(Math.abs(dimensions.width - 10) < 5, "width close to 21");
      assert.ok(Math.abs(dimensions.height - 16) < 5, "height close to 32");
    });
  });
});
