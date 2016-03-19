/**
 * Super-simple singleton DI tests.
 */

var assert = require('assert');
var DependencyGraph = require('../singleton-dependency-injection.js');

describe('dependency injector', function() {
  it('errors on circular injection', function() {
    var graph = new DependencyGraph();
    graph.add('foo', ['bar'], function(bar) {
    });
    graph.add('bar', ['foo'], function(foo) {
    });

    var correct_exception = false;
    try {
      graph.injector().instance('foo');
    } catch (e) {
      correct_exception = e.toString() === "Error: dependency injection: infinite call loop";
    }
    assert.ok(correct_exception);
  });

  it('works in the normal case', function() {
    var graph = new DependencyGraph();
    var call_count = 0;
    graph.add('foo', ['bar'], function(bar) {
      call_count += 1;
      return {type: 'foo', bar: bar};
    });
    graph.add('bar', ['baz'], function(baz) {
      return {type: 'bar', baz: baz};
    });
    graph.add('baz', [], function() {
      return {type: 'baz'};
    });

    // re-getting objects from the same injector returns their
    // singleton instances
    var injector = graph.injector();
    assert.deepEqual(
      injector.instance('foo'),
      {type: "foo", bar: {type: "bar", baz: {type: "baz"}}}
    );
    assert.equal(call_count, 1);
    injector.instance('foo');
    assert.equal(call_count, 1);

    // new injectors have a new scope though.
    graph.injector().instance('foo');
    assert.equal(call_count, 2);
  });

  it('supports lazy circular dependencies', function() {
    var graph = new DependencyGraph();
    graph.add('foo', [], function(injector) {
      return {
        name: 'foo',
        get_other: function() {
          return injector.instance('bar');
        }
      };
    });
    graph.add('bar', [], function(injector) {
      return {
        name: 'bar',
        get_other: function() {
          return injector.instance('foo');
        }
      };
    });

    var injector = graph.injector();
    var foo = injector.instance('foo');
    var bar = injector.instance('bar');

    assert.strictEqual(foo.name, 'foo');
    assert.strictEqual(foo.get_other().name, 'bar');
    assert.strictEqual(bar.name, 'bar');
    assert.strictEqual(bar.get_other().name, 'foo');
  });

  // Sometimes, variables come from elsewhere in JS land. We want to
  // be reasonably flexible with that case.
  it('supports manually-provided instances', function() {
    var graph = new DependencyGraph();
    graph.add('foo', ['bar'], function(bar) {
      return {
        name: 'foo',
        bar: bar
      };
    });

    var foo = graph.injector({bar: 'my bar instance'}).instance('foo');
    assert.deepEqual(foo, {
      name: 'foo',
      bar: 'my bar instance'
    });
  });
});
