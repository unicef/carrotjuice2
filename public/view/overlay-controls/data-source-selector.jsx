var React = require('react');
require('./data-source-selector.css');

var DataSourceSelector = React.createClass({
  display_name: function(name) {
    return this.props.data_layer.display_name(name);
  },

  createOption: function(option) {
    return <li key={option}>
      <a href="#" onClick={
        (function() { this.props.data_layer.set_base_layer(option); }).bind(this)
      }>{this.display_name(option)}</a>
    </li>;
  },

  render: function() {
    return <div className="data-source-selector dropdown">
      <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false">
        {this.display_name(this.props.data_layer.base_layer)}
        &nbsp;
        <span className="caret"/>
      </button>
      <ul className="dropdown-menu">
        {this.props.data_layer.get_available_base_layers().map(this.createOption)}
      </ul>
    </div>;
  }
});

module.exports = DataSourceSelector;
