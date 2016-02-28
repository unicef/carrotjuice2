var async = require('async');
var request_lib = require('request');

before(function(done) {
  // runs before all tests in this block
  var up = false;
  async.until(
    function() {
      return up;
    },
    function(cb) {
      request_lib("http://itest-frontend:8080/", function(err, response, body) {
        up = !err && response.statusCode === 200;
        // check every second
        setTimeout(function() {
          cb(null)
        }, (up ? 0 : 1000));
      });
    },
    done
  );
});
