var React = require('react');
require('./loading-status.css');

var LoadingStatus = React.createClass({
  render: function() {
    var is_initializing = this.props.model.is_initializing;
    var has_inflight_requests = this.props.model.inflight_requests > 0;
    if (is_initializing || has_inflight_requests) {
      var div_class = is_initializing ? 'loading-status-initializing' :
                      'loading-status-requests';
      return <div className={div_class}>
        <div className="centering-container">
          <p className="lead loading-status">
            Loading...
          </p>
        </div>
      </div>;
    } else {
      return null;
    }
  }
});

module.exports = LoadingStatus;
