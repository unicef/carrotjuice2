/**
 * When the user selects map layers (temperature / mosquito oviposition / etc.).
 */

var P = require('pjs').P;

var SelectLayersEvent = P({key: 'SelectLayersEvent'});

module.exports = SelectLayersEvent;
