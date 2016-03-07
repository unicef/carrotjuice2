var React = require('react');
require('./loading-status.css');

var LoadingStatus = React.createClass({
  render: function() {
    var visible = this.props.model.is_loading;
    return <div className="loading-status" style={{
      display: (visible ? 'block' : 'none')
    }}>
      <div className="loading-status-relbox">
        <div className="centering-container">
          <p className="lead">
            Loading, please wait ...
          </p>
        </div>
      </div>
    </div>
  }
});

module.exports = LoadingStatus;
