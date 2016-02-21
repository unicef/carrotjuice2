var config         = require('../config'); // get our config file
// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    // 'facebookAuth' : {
    //     'clientID'        : 'your-secret-clientID-here', // your App ID
    //     'clientSecret'    : 'your-client-secret-here', // your App Secret
    //     'callbackURL'     : 'http://localhost:8080/auth/facebook/callback'
    // },

    // 'twitterAuth' : {
    //     'consumerKey'        : 'your-consumer-key-here',
    //     'consumerSecret'     : 'your-client-secret-here',
    //     'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    // },

    'googleAuth' : {
        'clientID'         : process.env.client_id     || config.client_id,
        'clientSecret'     : process.env.client_secret || config.client_secret,
        'callbackURL'      : process.env.callbackURL   || config.callbackURL
    }

};
