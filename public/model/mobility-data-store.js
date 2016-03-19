/**
 * Stores mobility data.
 */

var _ = require('lodash');
var P = require('pjs').P;

var MobilityDataStore = P({
  init: function(on_update, api_client) {
    this.on_update = on_update;
    this.api_client = api_client;

    // `egress_records_by_date` is a mapping from date -> origin admin code -> destination admin
    // code -> mobility count:
    // {'2016-02-28T00:00:00.000Z': {'br-1': {'br-1': 1000, 'br-2': 100},
    //                               'br-2': {'br-1': 200, 'br-2': 2000}}
    // }
    this.egress_records_by_date = {};

    // TODO(jetpack): should we prefetch some data on load?
    this.initial_load_promise = Promise.resolve()
      .catch(function(err) { console.error('Error getting case data! ' + err); });
  },

  // TODO(jetpack): we probably want to get recent records, if there's no data for this exact date.
  get_egress_records: function(origin_admin_codes, date) {
    var origin_admins = _.reduce(origin_admin_codes,
                                 function(xs, x) { xs[x] = true; return xs; }, {});
    var records_for_date = this.egress_records_by_date[date.toISOString()];
    return _.pickBy(records_for_date, function(_destinations, origin_admin_code) {
      return _.has(origin_admins, origin_admin_code);
    });
  },

  fetch_egress_data: function(origin_admin_code, date) {
    console.log('Fetching mobility for admin', origin_admin_code, 'for date', date);
    return this.api_client.fetch_egress_mobility_data(origin_admin_code, date)
      .then((function(data) {
        console.log('..Got', data, 'mobility data for admin', origin_admin_code);
        this.egress_records_by_date = _.merge(this.egress_records_by_date, data);
      }).bind(this));
  },

  on_select: function(origin_admin_codes, date) {
    return Promise.all(origin_admin_codes.map((function(origin_admin_code) {
      return this.fetch_egress_data(origin_admin_code, date);
    }).bind(this)))
      .then(this.on_update.bind(this));
  }

});

module.exports = MobilityDataStore;
