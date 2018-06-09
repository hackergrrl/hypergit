var http = require('http')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var cat = require('pull-cat')
var Repo = require('hyperdb-git-repo')
var RepoPlusPlus = require('pull-git-repo')
var marked = require('marked')

module.exports = function (dbs) {
  var keyToDb = {}
  dbs.forEach(function (db) {
    keyToDb[db.key.toString('hex')] = {
      db: db,
      repo: RepoPlusPlus(Repo(db))
    }
  })

  var server = http.createServer(function (req, res) {
    res.setHeader('content-type', 'text/html')

    if (req.url === '/') {
      pull(
        cat([
          writeTitle(),
          pull.once('<p>Local repositories:</p>'),
          writeRepos(dbs)
        ]),
        toPull.sink(res)
      )
    } else if (/[0-9a-f]{64}/.test(req.url)) {
      var e = keyToDb[req.url.slice(1)]
      pull(
        cat([
          writeTitle(),
          writeRepo(e.db, e.repo)
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

function writeRepo (db, repo) {
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
    ),

    pull.once('<h4>HEAD Tree</h4>'),
    // files list
    deferred(function (cb) {
      repo.resolveRef('HEAD', function (err, hash) {
        pull(
          repo.readCommit(hash),
          pull.drain(function (field) {
            if (field.name === 'tree') {
              cb(null, writeTree(db, repo, field.value))
            }
          })
        )
      })
    }),
    // readme
    deferred(function (cb) {
      repo.resolveRef('HEAD', function (err, hash) {
        pull(
          repo.readCommit(hash),
          pull.drain(function (field) {
            if (field.name === 'tree') {
              pull(
                repo.readTree(field.value),
                pull.filter(function (elm) {
                  return /(readme|README).(md|markdown)/.test(elm.name)
                }),
                pull.collect(function (err, elms) {
                  var hash = (elms && elms.length && elms[0].id) || null
                  cb(null, writeReadme(db, repo, hash))
                })
              )
            }
          })
        )
      })
    }),
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

function deferredValue (fn) {
  var ended
  return function (end, cb) {
    fn(function (err, data) {
      if (err || ended) return cb(err || ended)
      ended = true
      cb(null, data)
    })
  }
}

function deferred (fn) {
  var next
  return function (end, cb) {
    if (next) return next(end, cb)
    fn(function (err, _next) {
      if (err) return cb(err)
      next = _next
      next(null, cb)
    })
  }
}

function writeTree (db, repo, hash) {
  return cat([
    pull.once('<div style="border-style: solid; border-color: black; border-width: 1px">'),

    // tree data
    pull(
      repo.readTree(hash),
      pull.map(function (elm) {
        return '<li>' + elm.name + '</li>'
      })
    ),

    pull.once('</div>')
  ])
}

function writeReadme (db, repo, hash) {
  return deferred(function (cb) {
    repo.getRef(hash, function (err, object, id) {
      pull(
        object.read,
        pull.collect(function (err, bufs) {
          if (err) return cb(null, pull.once(err.toString()))
          var text = Buffer.concat(bufs).toString()
          var body = '<code>' + marked(text) + '</code>'
          cb(null, pull.once(body))
        })
      )
    })
  }) 
}
