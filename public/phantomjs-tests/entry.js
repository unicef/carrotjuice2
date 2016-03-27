require("mocha/mocha.css");
require('!script!mocha/mocha.js');

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
require('./event-emitters/event-emitter-base-test.js');
require('./model/selected-date-test.js');
require('./view/overlay-controls/data-source-selector-test.jsx');
require('./api-client/api-client-mock-test.js');
window.mocha.run();
