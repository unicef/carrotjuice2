module.exports = function(app, passport) {
  var config       = require('./config'); // get our config file
  var helper       = require('./lib')
  var request      = require('request');
  var apicache     = require('apicache').options({ debug: true }).middleware;
  var request_json = require('request-json');
  var base_url     = process.env.base_url  || config.base_url
  var client       = request_json.createClient(base_url);
  var token        = process.env.token     || config.token
  whitelist        = process.env.whitelist || config.whitelist

  client.headers['token'] = token

  // whitelist will be a string on heroku
  if(typeof(whitelist) == "string"){
    whitelist = whitelist.split(/\s+/)
  }

  // Matrix with diagonal for coloring divisions by pop density on load
  app.get(
    '/api/diagonal/:divis_kind/:country_iso',
    function(req, res) {
    // log user request
    helper.save_request(req, 'logged_in')

    country_iso = req.params['country_iso']
    divis_kind  = req.params['divis_kind']
    url         = base_url  + 'diagonal/' + divis_kind + '/' + country_iso

    client.get(url, function(err, response, data) {
      try{
        res.json(data);
      }catch(e){
        console.log("PROBLEM with Matrices!")
        res.json([])
      }
    })
  });

  // Geojson for populating map with divisions
  app.get(
    '/api/division/:divis_kind/:country_iso',
     isLoggedIn,
     apicache('5 days'),
     function(req, res) {
    // log user request
    helper.save_request(req, 'logged_in')
    url = base_url + 'division/' + req.params['divis_kind'] + '/' + req.params['country_iso'];
    client.get(url, function(error, response, geojson){
      try{
        res.json(geojson);
      }catch(e){
        console.log("PROBLEM with Admins!!") //error in the above string(in this case,yes)!
        res.json([])
      }
    })
  });


  // show the home page (will also have our login links)
  app.get('/webgl', function(req, res) {
      res.render('webgl.ejs')
  });


// normal routes ===============================================================
  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
      res.render('index.ejs');
  });

  // main SECTION =========================
  app.get('/main', isLoggedIn, function(req, res) {
    res.render('main.ejs', {
        user : req.user
    });
  });

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.session.destroy(function (err) {
        res.redirect('/'); //Inside a callback… bulletproof!
      });
  });


  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
  passport.authenticate('google', {
          successRedirect : '/api/webgl',
          failureRedirect : '/'
  }));

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
      res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/main', // redirect to the secure main section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
      res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/main', // redirect to the secure main section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()){
    if(whitelist.filter(function(e){return e == req.user.google.email}).length>0)
      return next();

    if(whitelist.filter(function(e){return e == req.user.local.email}).length>0)
      return next();
  }

  res.redirect('/login');
}
