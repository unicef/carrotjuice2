var bodyParser = require('body-parser');
var compress = require('compression');
var cookieParser = require('cookie-parser');
var express = require('express');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var path = require('path');
var session = require('express-session');

var config = require('./config');
var routes = require('./routes');

var app = express();

app.use('/favicon.ico', express.static('images/favicon.ico'));

require('./config/passport')(passport); // pass passport for configuration

app.use(compress());  // gzip
// Set the static files location /public/img will be /img for users.
app.use(express.static(path.join(__dirname, 'build')));
app.use('/bower_components',
        express.static(path.join(__dirname, 'bower_components')));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
// parse application/vnd.api+json as json
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({secret: 'some_secret'})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(methodOverride()); // simulate DELETE and PUT (express4)

// load our routes and pass in our app and fully configured passport
routes.setup_routes(app, passport);

// launch ======================================================================
mongoose.connect(config.database);
app.listen(config.port);
console.log('Connected to datasbase', config.database);
console.log('The magic happens on', config.port);


