var compress = require('compression');
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

app.use('/favicon.ico', express.static('images/favicon.ico'));

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(compress());  // gzip
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'some_secret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(methodOverride());
// routes ======================================================================
require('./routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
var config = require('./config');
mongoose.connect(config.database);
app.listen(config.port);
console.log('Connected to datasbase', config.database);
console.log('The magic happens on', config.port);
