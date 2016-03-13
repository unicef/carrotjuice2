var request_lib = require('request');
var apicache = require('apicache').options({debug: true}).middleware;
var request_json = require('request-json');

var Entry = require('./app/models/entry');
var config = require('./config');

var base_url = process.env.base_url || config.base_url;
var client = request_json.createClient(base_url);
var token = process.env.token || config.token;
var whitelist = process.env.whitelist || config.whitelist;
client.headers.token = token;

/**
 * Set up all routes for the server.
 *
 * @param{app} app - App...
 * @param{passport} passport - Passport...
 */
function setup_routes(app, passport) {
  // whitelist will be a string on heroku
  if (typeof whitelist === 'string') {
    whitelist = whitelist.split(/\s+/);
  }

  var forward_route = function(req, res, next) {
    if (!req.url.match(/^\/api\//)) {
      return next(new Error("Bad URL " + req.url));
    }
    var url_without_api = req.url.replace(/^\/api\//, '');
    var url = base_url + url_without_api;
    save_request(req, 'logged_in');

    // hopefully, make the request w/o re-parsing JSON
    request_lib(url, function(error, response, body) {
      if (error) { return next(error); }
      res.set('Content-Type', 'application/json');
      res.status(response.statusCode);
      res.send(body);
    });
  };

  // Get regions (including polygons) from backend.
  app.get('/api/regions/:country_code', apicache('1 day'), forward_route);
  app.get('/api/admin_polygons_topojson/:country_code', apicache('1 day'), forward_route);

  // Get recent weather data for all regions.
  app.get('/api/country_weather/:country_code/:time?', apicache('1 day'),
          forward_route);

  // Get weather data for a single regions.
  app.get('/api/region_weather/:country_code/:region_code/:start_time?/:end_time?',
          apicache('1 day'), forward_route);

  /*
  We're replacing these with Webpack/React/Flux.

  Login & Logout will become API methods.

  // Show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/main', isLoggedIn, function(req, res) {
    res.render('main.ejs', {user: req.user});
  });

  app.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
      if (err) { return next(err); }
      // TODO(mikefab): what does this comment mean?
      res.redirect('/'); // Inside a callback… bulletproof!
    });
  });
  */

  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  app.get('/auth/google',
          passport.authenticate('google', {scope: ['profile', 'email']}));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
          passport.authenticate('google', {
            successRedirect: '/main',
            failureRedirect: '/'
          }));

  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', {message: req.flash('loginMessage')});
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/main', // redirect to the secure main section
    failureRedirect: '/login', // redirect back to the signup page on error
    failureFlash: true // allow flash messages
  }));

  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {message: req.flash('signupMessage')});
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/main', // redirect to the secure main section
    failureRedirect: '/signup', // redirect back to the signup page on error
    failureFlash: true // allow flash messages
  }));
}

/** Ensure user is logged in */
// eslint-disable-next-line require-jsdoc
function isLoggedIn(req, res, next) {
  var is_whitelisted = function() {
    return whitelist.some(function(e) {
      return e === req.user.google.email || e === req.user.local.email;
    });
  };
  if (process.env.NODE_ENV === 'development' ||
      (req.isAuthenticated() && is_whitelisted())) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Log user's request
// eslint-disable-next-line require-jsdoc
function save_request(req, kind) {
  var entry = new Entry({
    ip: req.header('x-forwarded-for'),
    ip2: req._remoteAddress,
    date: new Date(),
    url: req.url,
    kind: kind
  });
  entry.save();
}

module.exports = {
  setup_routes: setup_routes
};
