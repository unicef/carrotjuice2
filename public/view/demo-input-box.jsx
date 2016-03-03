var React = require('react');

var InputBox = React.createClass({
  render: function() {
    return <input type="text" value={
      this.props.model.value
    }></input>;
  }
});

module.exports = InputBox;
