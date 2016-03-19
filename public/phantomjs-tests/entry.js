require("mocha/mocha.css");
require('!script!mocha/mocha.js');

// Load bootstrap. Requires JQuery be made available as
// a global window variable.
require('expose?$!expose?jQuery!jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap/dist/js/bootstrap.js');

// pull in global leaflet styling
require('leaflet/dist/leaflet.css');

// call init helper for Mocha <--> PhantomJS binding
//
// If you run the tests in the browser (just go to test.html), this
// won't be automatically injected. But it's fine to run the tests
// that way.
if (window.initMochaPhantomJS !== undefined) {
  window.initMochaPhantomJS();
}

// global utility stuff
window.test_content_div = document.getElementById("test-content");

window.mocha.setup('bdd');
require('./global-hooks.js');
require('./singleton-dependency-injection-test.js');
require('./model/selected-date-test.js');
require('./view/overlay-controls/data-source-selector-test.jsx');
require('./api-client/api-client-mock-test.js');
require('./map-controller/map-controller-test.jsx');
window.mocha.run();
