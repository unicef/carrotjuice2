var React = require('react');
var Typeahead = require('react-typeahead').Typeahead;
require('./admin-search.css');

var AdminSearch = React.createClass({

  search_key_to_admin: {},

  admins: function() {
    var admin_objs = this.props.admin_details.admin_data_by_code;
    var search_key_to_admin = this.search_key_to_admin;
    // Maintain array of selected country iso codes
    var available_countries = Object.keys(
      this.props.selected_countries.selected_country_codes
    );

    // Maintain list of admins that belong to selected countries
    var admins = Object.keys(this.props.admin_details.admin_data_by_code)
    .filter(function(key) {
      var admin_code = admin_objs[key].admin_code.split('-')[0];
      return available_countries.find(function(e) {
        return e === admin_code;
      });
    // Return array of admin names
    }).map(function(key) {
      var admin_code = admin_objs[key].admin_code;
      var name_code = admin_objs[key].name + ' ' + admin_code;
      search_key_to_admin[name_code] = admin_code;
      return name_code;
    }).sort();
    return admins;
  },

  optionSelected: function(admin_name_code) {
    var admin_code = this.search_key_to_admin[admin_name_code];
    this.props.admin_details.selected_admins.search_admin(admin_code);
  },

  render: function() {
    return <div className="admin-search" id="scrollable-dropdown-menu">
      Search: <Typeahead
    options={this.admins()}
    onOptionSelected={this.optionSelected}
    maxVisible={100}
  />
    </div>;
  }
});

module.exports = AdminSearch;
