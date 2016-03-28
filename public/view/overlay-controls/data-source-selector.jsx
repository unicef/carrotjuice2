var React = require('react');
require('./data-source-selector.css');

var DataSourceSelector = React.createClass({
  display_name: function(name) {
    return this.props.selected_layers.display_name(name);
  },

  create_opacity_slider: function() {
    return <input id="data-source-opacity" type="range" min="0" max="1" step="0.1"
                  value={this.props.selected_layers.base_opacity} onChange={(function(event) {
                    this.props.selected_layers.set_base_opacity(event.target.value);
                  }).bind(this)} />;
  },

  createBaseLayerOption: function(layer_name) {
    return <li key={layer_name}>
      <a href="#" onClick={
        (function() { this.props.selected_layers.set_base_layer(layer_name); }).bind(this)
      }>{this.display_name(layer_name)}</a>
    </li>;
  },

  // TODO(jetpack): make this a nice switch thingy instead.
  createOverlayLayerToggle: function(layer_name) {
    return <div key={layer_name}>
      {this.display_name(layer_name)}:
      <button type="button" className="btn btn-primary" data-toggle="button" aria-pressed="false"
              onClick={
                (function() {this.props.selected_layers.toggle_overlay_layer(layer_name); }).bind(this)
      }>
        {this.props.selected_layers.overlay_layers_status[layer_name] ? 'On' : 'Off'}
      </button>
    </div>;
  },

  render: function() {
    return <div className="data-source-selector">
      <div>Opacity: {this.create_opacity_slider()}</div>
      Data source:
      <div className="data-source-selector-base dropdown">
        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
          {this.display_name(this.props.selected_layers.base_layer)}
          &nbsp;
          <span className="caret"/>
        </button>
        <ul className="dropdown-menu">
          {this.props.selected_layers.get_available_base_layers().map(this.createBaseLayerOption)}
        </ul>
      </div>
      <div className="data-source-selector-overlays">
        {this.props.selected_layers.get_available_overlay_layers().map(this.createOverlayLayerToggle)}
      </div>
    </div>;
  }
});

module.exports = DataSourceSelector;
