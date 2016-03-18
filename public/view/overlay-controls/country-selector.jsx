var React = require('react');
require('./country-selector.css');

var CountrySelector = React.createClass({
  // TODO(jetpack): library.
  display_name: function(country_code) {
    switch (country_code) {
      case 'br': return 'Brazil';
      case 'co': return 'Colombia';
      case 'pa': return 'Panama';
      case 'us': return 'USA';
      default: return country_code;
    }
  },

  create_country_toggle: function(country_code) {
    return <label key={country_code} className="country-selector-label btn btn-primary active"
                  onClick={(function() {
                    this.props.selected_countries.toggle_country(country_code);
                  }).bind(this)}>
      <input type="checkbox" defaultChecked/>
      {this.display_name(country_code)}
    </label>;
  },

  render: function() {
    return <div className="btn-group" data-toggle="buttons" >
      {this.props.selected_countries.available_options.map(this.create_country_toggle)}
    </div>;
  }
});

module.exports = CountrySelector;
