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
    // {start_time: <Date>, end_time: <Date>, data: <region epi data>}
    //
    // The array is sorted by `start_time`. The times are all at midnight UTC.
    // The time interval is half-open: [start_time, end_time). So, with
    // start_time = 2016-01-01 and end_time = 2016-01-08, the interval contains
    // data for 2016-01-01 up to and including 2016-01-07.
    //
    // Region epi data is a mapping from region code -> condition ->
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
         data: {4589: {fake_dengue: 111},
                4611: {fake_dengue: 121, fake_zika: 122},
                4877: {fake_dengue: 1131, fake_zika: 1132}}
        },
        // Feb 8 - Feb 15: Missing dengue data for 4611. Also, 4877 has chikungunya data.
        {start_time: utc_date(2016, 2, 8), end_time: utc_date(2016, 2, 15),
         data: {4589: {fake_dengue: 211, fake_zika: 212},
                4611: {fake_zika: 222},
                4877: {fake_dengue: 1231, fake_zika: 1232, fake_chikungunya: 1233}}
        },
        // Feb 15 - Mar 8: Missing data completely for 4611. Also, 22-day time interval.
        {start_time: utc_date(2016, 2, 15), end_time: utc_date(2016, 3, 8),
         data: {4589: {fake_dengue: 311, fake_zika: 312},
                4877: {fake_dengue: 1331, fake_zika: 1332}}
        },
        // Feb 15 - Feb 29: Some of the missing data for 4611, but only 2 weeks instead of 22 days!
        {start_time: utc_date(2016, 2, 15), end_time: utc_date(2016, 2, 29),
         data: {4611: {fake_dengue: 321, fake_zika: 322}}
        }

      ];
      this.most_recent_start_time = _.last(this.data_by_date_interval_and_region).start_time;
    }).bind(this));
  },

  latest_epi_data_by_region: function() {
    if (this.most_recent_start_time) {
      var recent_data = _.filter(this.data_by_date_interval_and_region,
                                 ['start_time', this.most_recent_start_time]);
      // There may be multiple epi data records with the same `start_time`
      // value. For now, we just choose the one that mentions the most regions.
      var best_recent_record = _.reduce(recent_data, function(best_recent_record, recent_record) {
        if (_.size(recent_record.data) > _.size(best_recent_record.data)) {
          return recent_record;
        } else {
          return best_recent_record;
        }
      });
      return best_recent_record;
    }
  },

  // Returns value from [0, 1], representing relative badness.
  epi_data_to_severity: function(epi_data) {
    var case_sum = _.reduce(epi_data, function(case_sum, cases) {
      return case_sum + cases;
    }, 1);
    // TODO(jetpack): consult with UX + research on what makes sense here.
    var severity = Math.min(1, Math.log(case_sum) / 10);
    console.log('case sum & severity for epi data:', epi_data, case_sum, severity);
    return severity;
  },

  epi_data_to_html_string: function(epi_data) {
    var lines = [];
    _.forEach(epi_data, function(cases, condition) {
      lines.push(condition + ' cases: ' + String(cases));
    });
    return lines.join('<br/>');
  }

});

module.exports = EpiDataStore;
