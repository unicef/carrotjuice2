/**
 * Stores mobility data.
 */

var _ = require('lodash');
var P = require('pjs').P;
var Q = require('q');

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

    // TODO(jetpack): get real data.
    this.initial_load_promise = Q.delay(10).then((function() {
      this.egress_records_by_date = {
        // 4589 is Iguape, 4611 is Itanhaém, and 4877 is São Paulo.
        '2016-02-28T00:00:00.000Z': {'br-4589': {'br-4589': 1000, 'br-4611': 100, 'br-4877': 500},
                                     'br-4611': {'br-4589': 120, 'br-4611': 2000, 'br-4877': 600},
                                     'br-4877': {'br-4589': 200, 'br-4611': 300,
                                                 'br-4877': 10000},
                                     'co-987': {'co-987': 2000, 'co-1001': 100, 'co-1051': 500},
                                     'co-1001': {'co-987': 200, 'co-1001': 4000, 'co-1051': 700},
                                     'co-1051': {'co-987': 300, 'co-1001': 400, 'co-1051': 5000}
                                    },
        '2016-02-29T00:00:00.000Z': {'br-4589': {'br-4589': 1010, 'br-4611': 110, 'br-4877': 510},
                                     'br-4611': {'br-4589': 130, 'br-4611': 2010, 'br-4877': 610},
                                     'br-4877': {'br-4589': 210, 'br-4611': 810,
                                                 'br-4877': 11000},
                                     'co-987': {'co-987': 2100, 'co-1001': 200, 'co-1051': 600},
                                     'co-1001': {'co-987': 300, 'co-1001': 4100, 'co-1051': 800},
                                     'co-1051': {'co-987': 400, 'co-1001': 500, 'co-1051': 5100}
                                    }
      };
    }).bind(this))
      .catch(function(err) { alert('Error getting case data! ' + err); });
  },

  // TODO(jetpack): we probably want to get recent records, if there's no data for this exact date.
  get_egress_records: function(origin_admin_codes, date) {
    var origin_admins = _.reduce(origin_admin_codes,
                                 function(xs, x) { xs[x] = true; return xs; }, {});
    var records_for_date = this.egress_records_by_date[date.toISOString()];
    return _.pickBy(records_for_date, function(_destinations, origin_admin_code) {
      return _.has(origin_admins, origin_admin_code);
    });
  }

});

module.exports = MobilityDataStore;
