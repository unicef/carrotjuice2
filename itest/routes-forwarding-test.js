var assert = require('assert');
var request_lib  = require('request');

describe('routes forwarding', function() {
  describe('admin polygons', function () {
    it('should return a valid response for a valid country', function (done) {
      var url = "http://itest-frontend:8080/api/admin_populations/br";
      request_lib(url, function(error, response, body) {
        if (error) { return done(error); }
        assert.equal(response.statusCode, 200);
        var result = JSON.parse(body);
        done();
      });
    });

    it('should return a 404 for an invalid country', function (done) {
      var url = "http://itest-frontend:8080/api/admin_populations/zz";
      request_lib(url, function(error, response, body) {
        if (error) { return done(error); }
        assert.equal(response.statusCode, 404);
        done();
      });
    });
  });
});
