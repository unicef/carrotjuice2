/**
 * Combinators/modifiers for views/JSX elements.
 */

var React = require('react');

var flexbox_stack = function(elements) {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%'
  }}>
    {elements}
  </div>;
};

module.exports = {
  flexbox_stack: flexbox_stack
};
