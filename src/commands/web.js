var http = require('http')
var web = require('gitverse')
var u = require('../utils')

var getAllHyperdbs = u.getAllHyperdbs

module.exports = function webCommand () {
  getAllHyperdbs(function (err, dbs) {
    var server = http.createServer(web(dbs))
    server.listen(9111, function () {
      console.log('gitverse live on http://localhost:9111')
    })
  })
}