var Entry          = require('./app/models/entry')

module.exports = {
  // Log user's request
  save_request: function(req, kind){
    e = new Entry(
        {
            ip:   req.header('x-forwarded-for'),
            ip2:  req._remoteAddress,
            date: new Date(),
            url:  req.url,
            kind: kind
        })
    e.save()
  }
}