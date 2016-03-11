/**
 * Codez for the bottom date selector widget. Also displays weather data.
 */
var React = require('react');
var DatePicker = require('react-datepicker');
var d3 = require('d3');
var moment = require('moment');

var DateUtil = require('../model/date-util.js');

require('react-datepicker/dist/react-datepicker.css');
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
  get_area_points: function(data) {
    var height = 130;  // constant via css
    var x_scale = this.state.x_time_scale;
    // TODO(jetpack): hack: hard-coded domain for fake weather.
    var y_scale = d3.scale.linear().domain([-20, 50])
      .range([height - 30, 0]);

    var make_area_graph = d3.svg.area()
      .x(function(d) {
        return x_scale(d.x);
      })
      .y0(y_scale(-20))
      .y1(function(d) {
        return y_scale(d.y);
      });

    return make_area_graph(data);
  },

  get_weather_graph: function() {
    // TODO(jetpack): hack: just using first region.
    var selected_region_code = this.props.selected_regions.get_region_codes()[0];
    if (selected_region_code) {
      var weather_data = this.props.weather_data_store.weather_data_by_date_for_region(
        selected_region_code);
      var points_data = [];
      _.forEach(weather_data, function(weather_data, date_string) {
        if (weather_data && weather_data.temp_mean) {
          points_data.push({x: new Date(date_string), y: weather_data.temp_mean});
        }
      });
      return this.get_area_points(points_data);
    } else {
      console.log('Not drawing weather graph: no selected region.');
    }
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

  // Note: DatePicker works with moment objects, but we use plain old Dates in
  // `selected_date`. So we convert from moment to Date here, and from Date to
  // moment in `render`.
  on_date_change: function(moment) {
    var date = new Date(moment._d);
    date.setUTCHours(0, 0, 0);
    console.log('date input and converted date:', moment._d, date);
    this.props.selected_date.set_date(date);
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
    // TODO(jetpack): if no regions selected, display help text (e.g. "yo, click a region")
    var num_days = 120;
    var today = new Date();
    this.state.x_time_scale.domain([DateUtil.subtract_days(today, num_days), today]);
    return <div className="date-selection-bar" id="date-selection-bar">
      <svg>
        <path id="time-series" d={this.get_weather_graph()}/>
        <g
          className="axis"
          ref={this.initialize_x_axis}
          transform="translate(30, 100)"
        />
      </svg>
      <div className="floating-header">
        Select a date:
        <DatePicker selected={moment(this.props.selected_date.current_day)}
                    onChange={this.on_date_change} />
      </div>
    </div>;
  }
});

module.exports = DateSelectionBar;
