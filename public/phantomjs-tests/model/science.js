var _ = require('lodash');
var assert = require('assert');
var Science = require('../../model/science.js');

function approx_equal(x, y, threshold) {
  threshold = threshold === undefined ? 0.01 : threshold;
  return Math.abs(x - y) < threshold;
}

describe('model/science', function() {
  describe('prevalence model', function() {
    // TODO(jetpack): this function seems to diverge to infinity ~28.916... asking research folks
    // what's up with that.
    var temp_to_prevalence = Science.MosquitoPrevalenceModel.prototype.temp_to_prevalence;

    it('should be more or less sane', function() {
      assert(approx_equal(temp_to_prevalence(0), 1.322));
      assert(approx_equal(temp_to_prevalence(10), 143.442));
      assert(approx_equal(temp_to_prevalence(20), 3005.643));
      assert(approx_equal(temp_to_prevalence(30), 8.26446e7, 1e2));
      assert(approx_equal(temp_to_prevalence(40), 13.809));
    });

    it('should increase from 0 °C to 28 °C', function() {
      var prev_prevalence = temp_to_prevalence(0);
      _.range(0.5, 28.5, 0.5).forEach(function(temp) {
        var prevalence = temp_to_prevalence(temp);
        assert(prev_prevalence < prevalence);
        prev_prevalence = prevalence;
      });
    });

    it('should never give a negative result', function() {
      _.range(-100, 100).forEach(function(temp) {
        assert(temp_to_prevalence(temp) >= 0);
      });
    });
  });

  describe('oviposition model', function() {
    var temp_to_ovi = Science.OvipositionModel.prototype.temp_to_oviposition;

    it('should have a max of ~8.79 at ~30.4 °C', function() {
      assert(approx_equal(temp_to_ovi(30.406), 8.795));
      _.range(0, 50, 0.25).forEach(function(temp) {
        assert(temp_to_ovi(temp) < 8.8);
      });
    });

    it('should increase from 13 °C to 28 °C', function() {
      var prev_ovi = temp_to_ovi(13);
      _.range(13.5, 28.5, 0.5).forEach(function(temp) {
        var ovi = temp_to_ovi(temp);
        assert(prev_ovi < ovi);
        prev_ovi = ovi;
      });
    });

    it('should never give a negative result', function() {
      assert.strictEqual(0, temp_to_ovi(-10));
      assert.strictEqual(0, temp_to_ovi(8.5));
      assert.strictEqual(0, temp_to_ovi(50));
      _.range(-100, 100).forEach(function(temp) {
        assert(temp_to_ovi(temp) >= 0);
      });
    });
  });
});
