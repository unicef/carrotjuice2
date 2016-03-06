/**
 * Codez for the bottom date selector widget. Will soon use D3 and
 * stuff ...
 */
var React = require('react');
require('./date-selection-bar.css');

var DateSelectionBar = React.createClass({
  render: function() {
    return <div className="date-selection-bar">
      Date selector widget here...
      <br />
      Selected date: {this.props.selected_date.current_day.toString()};
    </div>
  }
});

module.exports = DateSelectionBar;
