require("mocha/mocha.css");
require('!script!mocha/mocha.js');

// call init helper for Mocha <--> PhantomJS binding
if (window.initMochaPhantomJS !== undefined) {
  window.initMochaPhantomJS();
}

// global utility stuff
window.test_content_div = document.getElementById("test-content");

window.mocha.setup('bdd');
require('./global-hooks.js');
require('./model/selected-date-test.js');
require('./view/overlay-controls/data-source-selector-test.jsx');
window.mocha.run();
