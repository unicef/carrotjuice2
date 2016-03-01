var _ = require('lodash');

var process_env_or = function(names, default_value) {
  if (names instanceof Array) {
    var env_var = _.find(names, function(name) { return process.env[name]; });
    return process.env[env_var] || default_value;
  }
  return process.env[names] || default_value;
};

module.exports = {
  port: process_env_or('PORT', 8000),
  database: process_env_or(['PROD_DB', 'MONGOHQ_URL'],
                           'mongodb://localhost/carrotjuice'),
  testdb: process_env_or('TEST_DB', 'mongodb://localhost/carrotjuice-test'),
  whitelist: ['user1@gmail.com', 'user2@example.org'],
  client_id: 'xxxxxxxx.apps.googleusercontent.com',
  client_secret: 'secret',
  base_url: 'http://localhost:8002/api/',
  callbackURL: 'http://localhost:8080/auth/google/callback',
  token: 'jsonwebtoken-asdf...'
};
