var http = require('http')
var web = require('gitverse')

module.exports = function (dbs) {
  var server = http.createServer(web(dbs))
  server.listen(9111, function () {
    console.log('gitverse live on http://localhost:9111')
  })
}
