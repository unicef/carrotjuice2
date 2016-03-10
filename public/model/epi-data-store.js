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

var utc_date = function(year, month, day) {
  // Note: months are zero-indexed.
  return new Date(Date.UTC(year, month - 1, day));
};

// TODO(jetpack): screaming for unit tests.

var EpiDataStore = P({
  init: function(on_update) {
    this.on_update = on_update;

    // `data_by_date_interval_and_region` format is an array of objects that looks
    // like this:
    // {start_time: <Date>, end_time: <Date>, region_case_data: <region case data>}
    //
    // The array is sorted by `start_time`. The times are all at midnight UTC.
    // The time interval is half-open: [start_time, end_time). So, with
    // start_time = 2016-01-01 and end_time = 2016-01-08, the interval contains
    // data for 2016-01-01 up to and including 2016-01-07.
    //
    // Region case data is a mapping from region code -> condition ->
    // culmulative case count. For example:
    // {br1: {dengue: 120, malaria: 110, zika: 100},
    //  br2: {dengue: 220, malaria: 210},
    //  br3: {malaria: 310, zika: 300}}
    this.data_by_date_interval_and_region = [];
    this.most_recent_start_time = null;

    this.initial_load_promise = Q.delay(10).then((function() {
      // 4589 is Iguape, 4611 is Itanhaém, and 4877 is São Paulo.
      this.data_by_date_interval_and_region = [
        // Feb 1 - Feb 8: Missing malaria data for 4589.
        {start_time: utc_date(2016, 2, 1), end_time: utc_date(2016, 2, 8),
         region_case_data: {4589: {fake_dengue: 111},
                            4611: {fake_dengue: 121, fake_zika: 122},
                            4877: {fake_dengue: 1131, fake_zika: 1132}}
        },
        // Feb 8 - Feb 15: Missing dengue data for 4611. Also, 4877 has chikungunya data.
        {start_time: utc_date(2016, 2, 8), end_time: utc_date(2016, 2, 15),
         region_case_data: {4589: {fake_dengue: 211, fake_zika: 212},
                            4611: {fake_zika: 222},
                            4877: {fake_dengue: 1231, fake_zika: 1232, fake_chikungunya: 1233}}
        },
        // Feb 15 - Feb 29: Only has data for 4611. 2 weeks.
        {start_time: utc_date(2016, 2, 15), end_time: utc_date(2016, 2, 29),
         region_case_data: {4611: {fake_dengue: 321, fake_zika: 322}}
        },
        // Feb 15 - Mar 8: Only has data fro 4589 and 4877. Overlaps with previous time span,
        // but longer.
        {start_time: utc_date(2016, 2, 15), end_time: utc_date(2016, 3, 8),
         region_case_data: {4589: {fake_dengue: 311, fake_zika: 312},
                            4877: {fake_dengue: 1331, fake_zika: 1332}}
        }
      ];
      this.most_recent_start_time = _.last(this.data_by_date_interval_and_region).start_time;
    }).bind(this));
  },

  // Return a recent epi data record. If there are multiple records that include
  // the given `date`, returns the one that has data on the most regions. If
  // there are no records that include `date`, returns the most recent record
  // that occurred before the date.
  get_best_recent_epi_data: function(date) {
    // TODO(jetpack): binary search instead of linear scan.
    var matching_records = _.filter(this.data_by_date_interval_and_region, function(record) {
      return record.start_time <= date && date < record.end_time;
    });
    if (matching_records.length) {
      console.log('EDS GBRED matching records:', matching_records);
      var best_record = _.reduce(matching_records, function(best_record, record) {
        return (_.size(record.region_case_data) > _.size(best_record.region_case_data)) ?
          record : best_record;
      });
      return best_record;
    }
    // No epi records contain `date`. Find the record with the most recent
    // `start_time` that occurred before the date.
    // TODO(jetpack): binary search instead of linear scan.
    console.log('EpiDataStore doesnt have matching data for', date,
                ', just looking for most recent data now..');
    return _.findLast(this.data_by_date_interval_and_region, function(record) {
      console.log('testing if', record.start_time, 'older than', date, 'for record', record);
      return record.start_time < date;
    });
  },

  get_recent_epi_data_for_region: function(date, region_code) {
    // TODO(jetpack): binary search instead of linear scan.
    var matching_record = _.findLast(this.data_by_date_interval_and_region, function(record) {
      return record.start_time <= date && date < record.end_time &&
        _.has(record.region_case_data, region_code);
    });
    if (matching_record) {
      return matching_record;
    }
    console.log('EpiDataStore doesnt have matching data for', date, region_code,
                ', just looking for most recent data now..');
    return _.findLast(this.data_by_date_interval_and_region, function(record) {
      return record.start_time < date && _.has(record.region_case_data, region_code);
    });
  },

  // Returns value from [0, 1], representing relative badness.
  case_data_to_severity: function(case_data) {
    var total_cases = _.reduce(case_data, function(total_cases, num_cases) {
      return total_cases + num_cases;
    }, 0);

    // TODO(jetpack): consult with UX + research on what makes sense here.
    var severity = Math.log(total_cases) / 10;
    console.log('total cases & severity for case data:', case_data, total_cases, severity);
    severity = Math.min(1, Math.max(0, severity));
    return severity;
  },

  case_data_to_html_string: function(case_data, start_time, end_time) {
    var date_string = (start_time && end_time) ?
        ['(', DateUtil.iso_to_yyyymmdd(start_time), ' to ', DateUtil.iso_to_yyyymmdd(end_time), ')']
        .join('') : '';
    var lines = [];
    _.forEach(case_data, function(num_cases, condition) {
      lines.push([condition, 'cases:', num_cases, date_string].join(' '));
    });
    return lines.join('<br/>');
  }

});

module.exports = EpiDataStore;
