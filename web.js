var http = require('http')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var cat = require('pull-cat')

module.exports = function (dbs) {
  var server = http.createServer(function (req, res) {
    res.setHeader('content-type', 'text/html')
    pull(
      cat([
        writeTitle(),
        writeRepos(dbs)
      ]),
      toPull.sink(res)
    )
  })
  server.listen(9111, function () {
    console.log('gitverse live on http://localhost:9111')
  })
}

function writeTitle () {
  return pull.once('<h1>gitverse</h1>')
}

function writeRepos (dbs) {
  return pull(
    pull.values(dbs),
    pull.map(function (db) {
      return '<li>' + db.key.toString('hex') + '</li>'
    })
  )
}
