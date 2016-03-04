var React = require('react');
require('./overlay-controls-box.css');

var DataSourceSelector = React.createClass({
  createOption: function(option) {
    var onSelect = this.props.onSelect;
    return <li key={option}>
      <a href="#" onClick={
        function() { onSelect(option); }
      }>{option}</a>
    </li>;
  },
  render: function() {
    return <div className="data-source-selector dropdown">
      <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false">
        {this.props.currentlySelected}
        <span className="caret"/>
      </button>
      <ul className="dropdown-menu">
        {this.props.options.map(this.createOption)}
      </ul>
    </div>;
  }
});

var OverlayControlsBox = React.createClass({
  // TODO(zora): Move this to a dispatcher pattern
  onSelect: function(selection) {
    console.log("Selected " + selection);
  },

  render: function() {
    return <div className="overlay-controls-box">
      <h3>tbd control panel title</h3>
      <strong>Data source</strong>:
      <DataSourceSelector
        currentlySelected="selected"
        options={["foo", "bar", "baz"]}
        onSelect={this.onSelect}
      />
    </div>;
  }
});

module.exports = OverlayControlsBox;
