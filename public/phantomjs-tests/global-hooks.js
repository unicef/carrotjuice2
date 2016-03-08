// Clear the content div
var Q = require('q');

beforeEach(function() {
  if (window.test_content_div.innerHTML !== "") {
    console.log("clearing test content ...");
    return Q().then(function() {
      window.test_content_div.innerHTML = "";
    }).delay(1);
  }
});
