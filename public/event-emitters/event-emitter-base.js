/**
 * Defines the event emitter API.
 */

var _ = require('lodash');
var P = require('pjs').P;

var ListenerWrapper = P({
  init: function(callback, remove_after_call) {
    this.callback = callback;
    this.remove_after_call = remove_after_call;
  }
});

var check_action_class = function(action_class) {
  if (!action_class.prototype.key) {
    console.error("Bad action class, should have a key", action_class);
  }
};

var EventEmitter = P({
  init: function(action_types) {
    this.actions_by_key = {};
    this.listeners_by_action_key = {};
    _.forEach(action_types, (function(a) {
      check_action_class(a);
      this.actions_by_key[a.prototype.key] = a;
      this.listeners_by_action_key[a.prototype.key] = [];
    }).bind(this));
    if (_.keys(this.actions_by_key).length != action_types.length) {
      console.error("Some action keys are not unique!", action_types);
    }
  },

  emit: function(action) {
    if (!(action instanceof this.actions_by_key[action.key])) {
      console.error("Bad action, not of specified types", action);
    } else {
      var listeners = this.listeners_by_action_key[action.key];
      this.listeners_by_action_key[action.key] = [];
      _.forEach(listeners, function(l) {
        l.callback.call(null, action);
      });

      // Remove any one-time-only listeners, re-add any newly-added ones
      this.listeners_by_action_key[action.key] = _.filter(
        listeners,
        function(l) {
          return !l.remove_after_call;
        }
      ).concat(this.listeners_by_action_key[action.key]);
    }
  },

  add_listener: function(action_type, listener, remove_after_call) {
    check_action_class(action_type);
    this.listeners_by_action_key[action_type.prototype.key].push(
      new ListenerWrapper(listener, remove_after_call)
    );
  }
});

module.exports = EventEmitter;
