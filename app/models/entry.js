// grab the things we need
var mongoose     = require('mongoose');


// create a schema
var entrySchema = new mongoose.Schema(

  {
  	  date:       { type: Date, default: Date.now },
      ip:         { type: String},
      ip2:        { type: String},
      url:        { type: String},   
      kind:       { type: String},   
  }, { collection : 'entries' }
);


// the schema is useless so far
// we need to create a model using it
var Entry = mongoose.model('Entry', entrySchema);

// make this available to our users in our Node applications
module.exports = Entry;
