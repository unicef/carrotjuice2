/**
 * Tests basic usage of the event emitter pattern.
 */

var assert = require('assert');
var EventEmitter = require('../../event-emitters/event-emitter-base.js');
var P = require('pjs').P;

var EventA = P({key: 'Event A'});
var EventB = P({
  init: function(payload) {
    this.payload = payload;
  },
  key: 'Event B'
});

var TestEventEmitter = P(EventEmitter, function(proto, event_emitter) {
  proto.init = function() {
    event_emitter.init([EventA, EventB]);
  };
});

var Listener = P({
  init: function() {
    this.calls = [];
    this.callback = (function(action) {
      var plain_object = {};
      _.assign(plain_object, action);
      this.calls.push(plain_object);
    }).bind(this);
  }
});

describe('event-emitter/base', function() {
  it('works for a basic 2-event-type setup', function() {
    var listener_a_1 = new Listener();
    var listener_b_1 = new Listener();
    var listener_b_2 = new Listener();

    // create the event emitter, subscribe listeners.
    var ee = new TestEventEmitter();
    ee.add_listener(EventA, listener_a_1.callback);
    ee.add_listener(EventB, listener_b_1.callback);
    ee.add_listener(EventB, listener_b_2.callback);

    // calls should be zero
    assert.deepEqual(listener_a_1.calls, []);
    assert.deepEqual(listener_b_1.calls, []);
    assert.deepEqual(listener_b_2.calls, []);

    // after a new event of type A
    ee.emit(new EventA());
    assert.deepEqual(listener_a_1.calls, [{}]);
    assert.deepEqual(listener_b_1.calls, []);
    assert.deepEqual(listener_b_2.calls, []);

    // after a new event of type B
    ee.emit(new EventB("hello world"));
    assert.deepEqual(listener_a_1.calls, [{}]);
    assert.deepEqual(listener_b_1.calls, [{payload: "hello world"}]);
    assert.deepEqual(listener_b_2.calls, [{payload: "hello world"}]);

    // after a new event of type B
    ee.emit(new EventB("what a wonderful world"));
    assert.deepEqual(listener_a_1.calls, [{}]);
    assert.deepEqual(listener_b_1.calls, [
      {payload: "hello world"},
      {payload: "what a wonderful world"}
    ]);
    assert.deepEqual(listener_b_2.calls, [
      {payload: "hello world"},
      {payload: "what a wonderful world"}
    ]);
  });

  it('single-event listeners work fine', function() {
    var listener_a_1 = new Listener();

    // create the event emitter, subscribe listeners.
    var ee = new TestEventEmitter();
    ee.add_listener(EventA, listener_a_1.callback, true);

    // Event B shouldn't remove listener A (and shouldn't call it either).
    ee.emit(new EventB("hello world"));
    assert.deepEqual(listener_a_1.calls, []);

    // this should call and remove listener A
    ee.emit(new EventA());
    assert.deepEqual(listener_a_1.calls, [{}]);

    // further events should not add any new calls to listener A
    ee.emit(new EventA());
    assert.deepEqual(listener_a_1.calls, [{}]);
  });

  it('errors on duplicate event types', function() {
    assert.throws(function() {
      new EventEmitter([EventA, EventA]);
    }, Error);
  });

  it('errors when bad action types are given', function() {
    var ee = new TestEventEmitter();
    assert.throws(function() {
      ee.emit('bad action');
    }, /Bad action, not of specified types; got bad action/);

    var EventC = P({key: 'Event C'});
    assert.throws(function() {
      ee.emit(new EventC());
    }, /Bad action, not of specified types; got \[object Object\]/);
  });
});
