var _ = require('lodash');
var P = require('pjs').P;
var d3 = require('d3');

// TODO(jetpack): we should have comments with exact pointers into these papers for where we get our
// models, along with explanations for how and why we deviate from them...

// See the papers "Vectorial Capacity of Aedes aegypti: Effects of Temperature and Implications for
// Global Dengue Epidemic Potential" by J. Liu-Helmersson et al [1] and "Impact of human mobility on
// the emergence of dengue epidemics in Pakistan" by A. Wesolowski et al [2] for the source of the
// oviposition and mosquito prevalence models.
//
// [1] http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0089783
// [2] http://www.pnas.org/content/112/38/11887.abstract

var OvipositionModel = P({
  init: function(weather_data_store) {
    this.weather_data_store = weather_data_store;
    // `temp_to_oviposition` ranges from 0 to ~8.8. We map this linearly to a green, yellow, orange
    // color gradient.
    this.oviposition_to_color = d3.scale.linear().domain([0, 4.4, 8.8]).clamp(true)
      .range(['#b4d642', '#f8cd4e', '#ff7f47']);
  },

  temp_to_oviposition: function(x) {
    // Graph: https://www.desmos.com/calculator/nlvaakub6d
    var science = -5.4 + 1.8 * x - 0.2124 * Math.pow(x, 2) + 0.01015 * Math.pow(x, 3) -
        0.0001515 * Math.pow(x, 4);
    // This is just a fitted model. x < 8.78 and x > 37.2 give a negative result, which we just
    // treat as 0.
    return Math.max(0, science);
  },

  admin_color_for_date: function(date_string) {
    return _.mapValues(
      this.weather_data_store.data_by_date_and_admin[date_string],
      (function(data_obj) {
        return this.oviposition_to_color(this.temp_to_oviposition(data_obj.temp_mean));
      }).bind(this)
    );
  },

  // Return oviposition rate as an integer between 0 and 100.
  oviposition_factor_for_date_and_admin: function(date, admin_code) {
    var weather_data = _.get(this.weather_data_store.data_by_date_and_admin,
                             [date.toISOString(), admin_code]);
    if (_.has(weather_data, 'temp_mean')) {
      var oviposition = Math.max(0, this.temp_to_oviposition(weather_data.temp_mean));
      return Math.round(oviposition / 8.8 * 100);
    }
  }
});

var MosquitoPrevalenceModel = P({
  init: function(weather_data_store) {
    this.weather_data_store = weather_data_store;
    // `temp_to_prevalence` ranges from ~0 to ~1e8. We map this logarithmically to a white->red
    // color gradient.
    this.prevalence_to_color = d3.scale.log().domain([200, 1e8]).clamp(true)
      .range(['white', 'red']);
  },

  temp_to_prevalence: function(x) {
    var r_const = 8.314;  // Gas constant in J/K/mol.
    var k = x + 273.15;  // Temp in Kelvin.
    // Extrinsic incubation period of adult mosquito.
    var gamma_v = (3.3589e-3 / 298 * k * Math.exp(1500 / r_const * (1 / 298 - 1 / k))) /
        (1 + Math.exp(6.203e21 / r_const / -2.176e30 - 1 / k));
    // Adult mosquito mortality.
    var mu_v = 0.8692 - 0.1599 * x + 0.01116 * Math.pow(x, 2) - 3.408e-4 * Math.pow(x, 3) +
        3.809e-6 * Math.pow(x, 4);
    // Dengue suitability.
    return Math.exp(-mu_v * gamma_v) / Math.pow(mu_v, 2);
  },

  admin_color_for_date: function(date_string) {
    return _.mapValues(
      this.weather_data_store.data_by_date_and_admin[date_string],
      (function(data_obj) {
        return this.prevalence_to_color(this.temp_to_prevalence(data_obj.temp_mean));
      }).bind(this)
    );
  },

  // TODO(jetpack): consult w/ research on this and add link to graph to justify these thresholds.
  prevalence_to_category: function(p) {
    if (p < 2000) {
      return 'Very low';
    } else if (p < 3500) {
      return 'Low';
    } else if (p < 10000) {
      return 'Medium';
    } else if (p < 1e6) {
      return 'High';
    } else {
      return 'Very high';
    }
  },

  prevalence_for_date_and_admin: function(date, admin_code) {
    var weather_data = _.get(this.weather_data_store.data_by_date_and_admin,
                             [date.toISOString(), admin_code]);
    if (_.has(weather_data, 'temp_mean')) {
      var prevalence = Math.round(Math.max(0, this.temp_to_prevalence(weather_data.temp_mean)));
      return {
        value: prevalence,
        description: this.prevalence_to_category(prevalence)
      };
    }
  }
});

module.exports = {
  MosquitoPrevalenceModel,
  OvipositionModel
};
