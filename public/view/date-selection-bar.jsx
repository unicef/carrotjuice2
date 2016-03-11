/**
 * Codez for the bottom date selector widget. Also displays weather data.
 */
var React = require('react');
var d3 = require('d3');
var $ = require('jquery');

var DateUtil = require('../model/date-util.js');
var DatePicker = require('react-datepicker');
var moment = require('moment');

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

  /** Update on resize events */
  componentDidUpdate: function() {
    if (this.reset_x_axis !== undefined) {
      this.reset_x_axis();
    }
  },

  // TODO(jetpack): this is crappy. replace.
  crappy_date_input: function() {
    var input_string = $('#date-input').val();
    var date = new Date(input_string);
    date.setUTCHours(0, 0, 0);
    console.log('crappy date input, converted date:', input_string, date);
    this.props.selected_date.set_date(date);
  },

  handleChange: function(date) {
    // this.setState({
    //   startDate: date
    // });
    var input_string = date._d;
    var date = new Date(input_string);
    date.setUTCHours(0, 0, 0);
    console.log('crappy date input, converted date:', input_string, date);
    this.props.selected_date.set_date(date);


  },

  get_current_date: function() {
    if (this.props.selected_date.current_day) {
      return this.props.selected_date.current_day.toISOString();
    } else {
      return 'loading...';
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
        Current date: {this.get_current_date()}
        <br/>
        Select a date:
        <DatePicker selected={this.state.date} onChange={this.handleChange} />
      </div>
    </div>;
  }
});

module.exports = DateSelectionBar;
