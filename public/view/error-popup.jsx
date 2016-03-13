/**
 * Popup with any active error messages.
 */

var React = require('react');

var ERROR_REPORTING_LINK = "https://github.com/unicef/carrotjuice2/issues";

var ErrorPopup = React.createClass({
  dismiss_error: function() {
    this.props.error_handler.dismiss_all();
  },

  render: function() {
    return <div className="error-popup-container" style={{
      display: this.props.error_handler.get_active_errors().length ? 'block' : 'none'
    }}>
      <h3>Internal Error(s)</h3>
      <p>
        <em>
          Try reloading the page, or&nbsp;
          <a href={ERROR_REPORTING_LINK}>
            report the error to the developers
          </a>
        </em>.
        If the error is non-disruptive:&nbsp;
        <a href="#" onClick={this.dismiss_error}>Dismiss</a>.
      </p>
      {this.props.error_handler.get_active_errors().map(function(error) {
        return <div className="error-message">
          <span className="error-message-class">{error.cls}</span>:&nbsp;
          {error.text}
        </div>;
      })}
    </div>;
  }
});

module.exports = ErrorPopup;
