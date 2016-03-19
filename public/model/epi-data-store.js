/**
 * Stores epidemiological/case data.
 *
 * NOTE! This is a super hyper rough sketch. Data is *not* fetched from the
 * backend, but just hardcoded for now. We still need to decide on a reasonable
 * schema to account for temporal and spatial spottiness and inconsistencies.
 */

var _ = require('lodash');
var P = require('pjs').P;
var Q = require('q');

var DateUtil = require('./date-util.js');

var admin_to_country_code = function(admin_code) {
  return admin_code.match(/([a-z]{2})-/)[1];
};

// TODO(jetpack): screaming for unit tests.

var EpiDataStore = P({
  init: function(on_update) {
    this.on_update = on_update;

    // `records_by_country` format is map from country_code to an array of epi
    // data records:
    // {br: [<epi record>, <epi record>], co: [<epi record>]}
    //
    // Epi data records are wrappers around admin case data that include a time
    // interval:
    // {start_time: <Date>, end_time: <Date>, admin_case_data: <admin case data>}
    //
    // The array is sorted by `start_time`. The times are all at midnight UTC.
    // The time interval is half-open: [start_time, end_time). So, with
    // start_time = 2016-01-01 and end_time = 2016-01-08, the interval contains
    // data for 2016-01-01 up to and including 2016-01-07.
    //
    // Admin case data is a mapping from admin code -> condition ->
    // culmulative case count. For example:
    // {br-1: {dengue: 120, malaria: 110, zika: 100},
    //  br-2: {dengue: 220, malaria: 210},
    //  br-3: {malaria: 310, zika: 300}}
    this.records_by_country = {};

    this.initial_load_promise = Q.delay(10).then((function() {
      this.records_by_country = require('./hardcoded-epi-data.js');
    }).bind(this))
      .catch(function(err) { alert('Error getting case data! ' + err); });
  },

  // Returns recent epi data records for the given countries. If there are multiple records that
  // include the given `date`, returns the one that has data on the most admins. If there are no
  // records that include `date`, returns the most recent record that occurred before the date.
  //
  // TODO(jetpack): there should probably be some limit for the age of the data we return.
  //
  // TODO(jetpack): The returned records are not guaranteed to be for the same time interval. For
  // example, if the most recent data for Brazil is from 2016-01-01 and for Colombia is from
  // 2016-03-15, both data sets will be returned. This is probably misleading, but leaving for now
  // as we aren't sure what the UX for epi data should be yet.
  //
  // TODO(jetpack): binary search instead of linear scan.
  get_best_recent_epi_data: function(country_codes, date) {
    if (!(date instanceof Date)) {
      console.error('Expected a Date, but got:', date);
      return null;
    }
    var result = [];
    _.forEach(country_codes, (function(country_code) {
      var matching_records = _.filter(this.records_by_country[country_code], function(record) {
        return record.start_time <= date && date < record.end_time;
      });
      if (!_.isEmpty(matching_records)) {
        result.push(_.maxBy(matching_records, function(r) { return _.size(r.admin_case_data); }));
      } else {
        // No epi records contain `date`. Find the record with the most recent `start_time` that
        // occurred before the date.
        console.log('EpiDataStore doesnt have matching data for', date,
                    ', just looking for most recent data now..');
        var recent = _.findLast(this.records_by_country[country_code], function(record) {
          return record.start_time < date;
        });
        if (recent) {
          result.push(recent);
        }
      }
    }).bind(this));
    return result;
  },

  // TODO(jetpack): binary search instead of linear scan.
  get_recent_epi_data_for_admin: function(admin_code, date) {
    if (!(date instanceof Date)) {
      console.error('Expected a Date, but got:', date);
      return null;
    }
    var country_code = admin_to_country_code(admin_code);
    var matching_record = _.findLast(this.records_by_country[country_code], function(record) {
      return record.start_time <= date && date < record.end_time &&
        _.has(record.admin_case_data, admin_code);
    });
    if (matching_record) {
      return matching_record;
    }
    console.log('EpiDataStore doesnt have matching data for', date, admin_code,
                ', just looking for most recent data now..');
    return _.findLast(this.records_by_country[country_code], function(record) {
      return record.start_time < date && _.has(record.admin_case_data, admin_code);
    });
  },

  // Returns value from [0, 1], representing relative badness.
  case_data_to_severity: function(case_data) {
    var total_cases = _.sum(_.values(case_data));

    // TODO(jetpack): consult with UX + research on what makes sense here.
    var severity = Math.log(total_cases) / 10;
    console.log('total cases & severity for case data:', case_data, total_cases, severity);
    severity = Math.min(1, Math.max(0, severity));
    return severity;
  },

  case_data_to_display_strings: function(case_data, start_time, end_time) {
    var date_string = (start_time && end_time) ?
        ['(', DateUtil.iso_to_yyyymmdd(start_time), ' to ', DateUtil.iso_to_yyyymmdd(end_time), ')']
        .join('') : '';
    var lines = [];
    _.forEach(case_data, function(num_cases, condition) {
      lines.push([condition, 'cases:', num_cases, date_string].join(' '));
    });
    return lines;
  }

});

module.exports = EpiDataStore;
