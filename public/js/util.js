var stopwatch = (function() {
  var global_stopwatch_last_time = 0;

  /**
   * Reset stopwatch to time new sequence.
   * @param{object} msg - Gets logged.
   */
  function reset(msg) {
    global_stopwatch_last_time = Date.now();
    if (msg) { console.log('\n' + msg, global_stopwatch_last_time); }
  }

  // TODO(jetpack): change to log `arguments`, like console.log.
  /**
   * Log time since last click (or reset).
   * @param{object} msg - Gets logged along with the time.
   */
  function click(msg) {
    var now = Date.now();
    console.log(msg, now - global_stopwatch_last_time);
    global_stopwatch_last_time = now;
  }

  return {reset: reset, click: click};
})();

/** Returns summary statistics.
 * @param{Iterable} xs - Numbers to generate stats for.
 * @return{Object} Map with fields 'min', 'max', and 'total'.
 */
function summary_stats(xs) {
  return xs.reduce(function(stats, x) {
    if (x < stats.min) { stats.min = x; }
    if (x > stats.max) { stats.max = x; }
    stats.total += x;
    return stats;
  }, {min: Infinity, max: -Infinity, total: 0});
}

/** Logarithmically rescales a value in [min, max]. */
// eslint-disable-next-line require-jsdoc
function log_rescale(x, min, max) {
  return Math.log(x - min + 1) / Math.log(max - min + 1);
}

/**
 * Parse YYYY-MM-DD date string from an ISO format string. Example:
 * '2016-03-01T00:00:00.000Z' -> '2016-03-01'
 *
 * @param{string} iso_string - Date string in ISO format.
 * @return{string} YYYY-MM-DD date string.
 */
function iso_to_yyyymmdd(iso_string) {
  var match = iso_string.match(/(\d{4}-\d{2}-\d{2})T/);
  if (match && match.length === 2) {
    return match[1];
  } else {
    // console.error('Failed to YYYY-MM-DD from string:', iso_string);
    return null;
  }
}
