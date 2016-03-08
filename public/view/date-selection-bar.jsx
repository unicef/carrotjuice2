/**
 * Codez for the bottom date selector widget. Also displays weather data.
 */
var React = require('react');
var d3 = require('d3');

var DateUtil = require('../model/date-util.js');

require('./date-selection-bar.css');

var DateSelectionBar = React.createClass({
  // The range for `x_time_scale` is determined by the document width, which is
  // set via `componentDidUpdate`.
  getInitialState: function() {
    return {x_time_scale: d3.time.scale.utc()};
  },

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
    var x_scale = this.state.x_time_scale;
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
      {x: new Date(Date.UTC(2016, 2, 8)), y: 1},
      {x: new Date(Date.UTC(2016, 2, 7)), y: 0.8},
      {x: new Date(Date.UTC(2016, 2, 6)), y: 0.5},
      {x: new Date(Date.UTC(2016, 2, 5)), y: 0.1},
      {x: new Date(Date.UTC(2016, 2, 4)), y: 0.1},
      {x: new Date(Date.UTC(2016, 2, 3)), y: 0.5},
      {x: new Date(Date.UTC(2016, 2, 2)), y: 0.8},
      {x: new Date(Date.UTC(2016, 2, 1)), y: 1}
    ]);
  },

  initialize_x_axis: function(elt) {
    this.reset_x_axis = function() {
      this.state.x_time_scale.range([0, document.body.offsetWidth - 100]);
      var xAxis = d3.svg.axis()
        .ticks(d3.time.week.utc)
        .tickFormat(d3.time.format.utc("%b %d"))  // e.g. 'Mar 31'
        .scale(this.state.x_time_scale)
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
    // TODO(jetpack): what extent should we show? all available data? selected
    // date +/- N days? currently just current date - N days.
    var num_days = 60;
    var today = new Date();
    this.state.x_time_scale.domain([DateUtil.subtract_days(today, num_days), today]);
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
