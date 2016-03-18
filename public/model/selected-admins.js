/**
 * Which admins the user has selected.
 */

var P = require('pjs').P;

var SelectedAdmins = P({
  init: function(onUpdate) {
    this.onUpdate = onUpdate;
    // `selected_admin_codes` is a map from admin code to callbacks. The
    // callbacks are called when the admin is unselected.
    this.selected_admin_codes = {};
    this.hovered_admin_code = null;
  },

  // Note: `on_unselect` is only used when `admin_code` is toggled on.
  toggle_admin: function(admin_code, on_unselect) {
    if (this.is_admin_selected(admin_code)) {
      var cb = this.selected_admin_codes[admin_code];
      delete this.selected_admin_codes[admin_code];
      cb();
    } else {
      this.selected_admin_codes[admin_code] = on_unselect || _.noop;
    }
    this.onUpdate();
  },

  set_admin_hovered: function(admin_code) {
    this.hovered_admin_code = admin_code;
  },

  unset_admin_hovered: function(admin_code) {
    if (this.hovered_admin_code === admin_code) {
      this.hovered_admin_code = null;
    }
  },

  select_admin: function(admin_code, on_unselect) {
    if (this.is_admin_selected(admin_code)) {
      console.log('Admin', admin_code, 'already selected, not doing anything.');
      return;
    }

    // We only call the previously selected admins' on_unselect callbacks after
    // updating `selected_admin_codes`. This is so that when the callbacks run,
    // `selected_admin_codes` accurately reflects what is now selected.
    var unselect_cbs = _.values(this.selected_admin_codes);
    this.selected_admin_codes = {};
    this.selected_admin_codes[admin_code] = on_unselect || _.noop;
    unselect_cbs.forEach(function(cb) { cb(); });

    this.onUpdate();
  },

  get_admin_codes: function() {
    return _.keys(this.selected_admin_codes);
  },

  is_admin_selected: function(admin_code) {
    return _.has(this.selected_admin_codes, admin_code);
  },

  get_border_weight: function(admin_code) {
    if (this.is_admin_selected(admin_code)) {
      return 3;
    } else if (this.hovered_admin_code === admin_code) {
      return 2;
    } else {
      return 1;
    }
  }
});

module.exports = SelectedAdmins;
