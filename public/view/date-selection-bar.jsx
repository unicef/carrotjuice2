/**
 * Codez for the bottom date selector widget. Will soon use D3 and
 * stuff ...
 */
var React = require('react');
var d3 = require('d3');
require('./date-selection-bar.css');

var DateSelectionBar = React.createClass({
  /**
   * Uses d3.svg.area() to generate a polygon, representing the space between
   * two sets of 'y' coordinates. The bottom line (y0) is uncomplicated because
   * we aren't stacking multiple sets of data.
   *
   * NOTE: The DOM update after this method takes 100ms, and is executed a few
   * more times than it should be. So maybe it could be an optimization win in
   * the future.
   */
  get_area_points: function() {
    var height = 130;  // constant via css
    var width = document.body.offsetWidth;
    var x_scale = d3.scale.linear().domain([0, 1])
      .range([30, width - 60]);
    var y_scale = d3.scale.linear().domain([0, 1])
      .range([height - 30, 20]);

    var make_area_graph = d3.svg.area()
      .x(function(d) {
        return x_scale(d.x);
      })
      .y0(y_scale(0))
      .y1(function(d) {
        return y_scale(d.y);
      });
    return make_area_graph([
      {x: 0, y: 0.1},
      {x: 0.1, y: 0.3},
      {x: 0.2, y: 0.4},
      {x: 0.3, y: 0.3},
      {x: 0.4, y: 0.1}
    ]);
  },

  initialize_x_axis: function(elt) {
    this.reset_x_axis = function() {
      var width = document.body.offsetWidth - 60;
      var x_scale = d3.time.scale()
        .domain([new Date(2016, 2, 30), new Date()])
        .range([0, width]);
      var xAxis = d3.svg.axis()
        .ticks(d3.time.days, Math.min(10, Math.ceil(1700 / width)))
        .scale(x_scale)
        .orient("bottom");
      xAxis(d3.select(elt));
    };
    this.reset_x_axis();
  },

  /** Update on resize events */
  componentDidUpdate: function() {
    if (this.reset_x_axis !== undefined) {
      this.reset_x_axis();
    }
  },

  render: function() {
    return <div className="date-selection-bar" id="date-selection-bar">
      <svg>
        <path id="time-series" d={this.get_area_points()}/>
        <g
          className="axis"
          ref={this.initialize_x_axis}
          transform="translate(30, 100)"
        />
      </svg>
      <div className="floating-header">
        Select a date:
      </div>
    </div>;
  }
});

module.exports = DateSelectionBar;
