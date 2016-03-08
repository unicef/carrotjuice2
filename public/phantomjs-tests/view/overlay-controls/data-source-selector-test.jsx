var $ = require('jquery');
var assert = require('assert');
var DataSourceSelector = require('../../../view/overlay-controls/data-source-selector.jsx');
var Q = require('q');
var React = require('react');  // required to be in scope post-JSX compilation
var ReactDOM = require('react-dom');

describe('view/overlay-controls/data-source-selector', function() {
  it('mounts and contains reasonable elements', function() {
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
        <DataSourceSelector data_layer={data_layer}/>,
        window.test_content_div
      );
    }).delay(1).then(function() {
      var button_text = $('button span:first').text();
      assert.equal(button_text, 'test display name');
    });
  });
});
