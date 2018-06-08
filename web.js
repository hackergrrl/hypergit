var http = require('http')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var cat = require('pull-cat')

module.exports = function (dbs) {
  var keyToDb = {}
  dbs.forEach(function (db) {
    keyToDb[db.key.toString('hex')] = db
  })

  var server = http.createServer(function (req, res) {
    res.setHeader('content-type', 'text/html')

    if (req.url === '/') {
      pull(
        cat([
          writeTitle(),
          pull.once('<p>your local repositories:</p>'),
          writeRepos(dbs)
        ]),
        toPull.sink(res)
      )
    } else if (/[0-9a-f]{64}/.test(req.url)) {
      var db = keyToDb[req.url.slice(1)]
      pull(
        cat([
          writeTitle(),
          writeRepo(db)
        ]),
        toPull.sink(res)
      )
    }
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
      var key = db.key.toString('hex')
      return '<li><a href="'+key+'">' + key + '</a></li>'
    })
  )
}

function writeRepo (db) {
  return cat([
    pull.once('<h3>' + db.key.toString('hex') + '</h3>'),

    pull.once('<h4>Tags</h4>'),
    pull(
      getTags(db),
      pull.map(function (tag) {
        return `<li>${tag.name}: <code>${tag.hash}</code></li>`
      })
    ),

    pull.once('<h4>Branches</h4>'),
    pull(
      getBranches(db),
      pull.map(function (branch) {
        return `<li>${branch.name}: <code>${branch.hash}</code></li>`
      })
    )
  ])
}

function getTags (db) {
  return pull(
    toPull.source(db.createReadStream('git/refs')),
    pull.map(function (nodes) {
      var node = nodes[0]
      if (!/tag/.test(node.key)) return null
      var tag = node.key.replace('git/refs/tags/', '')
      return {
        name: tag,
        hash: node.value
      }
    }),
    pull.filter(function (data) {
      return !!data
    })
  )
}

function getBranches (db) {
  return pull(
    toPull.source(db.createReadStream('git/refs/heads')),
    pull.map(function (nodes) {
      var node = nodes[0]
      var branch = node.key.replace('git/refs/heads/', '')
      return {
        name: branch,
        hash: node.value
      }
    }),
    pull.filter(function (data) {
      return !!data
    })
  )
}
