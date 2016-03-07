/**
 * Some ports from util.js
 */

/**
 * Parse YYYY-MM-DD date string from an ISO format string. Example:
 * '2016-03-01T00:00:00.000Z' -> '2016-03-01'
 *
 * @param{string} iso_string - Date string in ISO format, or just a Date.
 * @return{string} YYYY-MM-DD date string.
 */
var iso_to_yyyymmdd = function(iso_string) {
  if (!iso_string) {
    return '';
  }  // Mysteriously getting called from template w/ null...
  if (iso_string instanceof Date) {
    iso_string = iso_string.toISOString();
  }
  var match = iso_string.match(/(\d{4}-\d{2}-\d{2})T/);
  if (match && match.length === 2) {
    return match[1];
  } else {
    // console.error('Failed to YYYY-MM-DD from string:', iso_string);
    return null;
  }
};

module.exports = {
  iso_to_yyyymmdd: iso_to_yyyymmdd
};
