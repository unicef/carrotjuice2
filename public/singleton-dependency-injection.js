/**
 * Minimal routine to create objects with dependencies.
 */

var _ = require('lodash');
var P = require('pjs').P;

/**
 * This class actually stores the singleton instances of [typically] objects created.
 */
var Injector = P({
  init: function(dependency_graph, initial_state) {
    this.dependency_graph = dependency_graph;
    // mapping name --> instance
    this.instances = (initial_state ? initial_state : {});
  },

  /**
   * @param name name of the instance to resolve
   * @param call_stack
   *     list of previous calls to instance(). we'll throw errors if we're stuck in a loop.
   * @returns {*}
   */
  instance: function(name, call_stack) {
    if (this.instances[name] !== undefined) {
      return this.instances[name];
    }

    var service_declaration = this.dependency_graph.services[name];
    if (service_declaration === undefined) {
      throw new Error("Object of type " + name + " is not defined; you can't get an instance.");
    }

    if (call_stack !== undefined && call_stack.indexOf(name) !== -1) {
      throw new Error("dependency injection: infinite call loop");
    }
    call_stack = call_stack ? call_stack.concat([name]) : [name];

    var deps = _.map(service_declaration.dependencies, (function(dep_name) {
      return this.instance(dep_name, call_stack);
    }).bind(this));
    var result = service_declaration.creator.apply(null, deps.concat([this]));
    this.instances[name] = result;
    return result;
  }
});

var DependencyGraph = P({
  init: function() {
    this.services = {};
  },

  add: function(name, dependencies, creator) {
    this.services[name] = {dependencies: dependencies, creator: creator};
  },

  add_constant: function(name, value) {
    return this.add(name, [], function() {
      return value;
    });
  },

  injector: function(initial_state) {
    return new Injector(this, initial_state);
  }
});

module.exports = DependencyGraph;
