var through = require('through2')
var u = require('../utils')

var getHypergitRemotes = u.getHypergitRemotes
var getHyperdb = u.getHyperdb
var createRemote = u.createRemote

function createFork (db, cb) {
  getHyperdb(null, function (err, newDb) {
    var t = through.obj(write, flush)
    db.createHistoryStream().pipe(t)

    function write (node, _, next) {
      console.log('copying', node.key)
      newDb.put(node.key, node.value, function (err) {
        if (err) throw err
        next()
      })
    }

    function flush (done) {
      console.log('flushing')
      done()
      cb(null, newDb)
    }
  })
}

module.exports = function fork () {
  getHypergitRemotes(function (err, remotes) {
    if (!remotes.length) {
      console.log('No hypergit remotes on this git repo.')
      return process.exit(1)
    } else if (remotes.length === 1) {
      var key = remotes[0].url.replace('hypergit://', '')
      getHyperdb(key, function (err, db) {
        if (err) throw err
        createFork(db, function (err, newDb) {
          var key = newDb.key.toString('hex')
          createRemote('fork', 'hypergit://' + key)
          console.log('Created new remote "fork": hypergit://' + key)
        })
      })
    } else if (!process.argv[3]) {
      console.log('Multiple hypergit remotes present. Specify which one you\'d like the id of.')
      return process.exit(1)
    } else {
      var remote = config.remote[process.argv[3]]
      if (!remote) {
        console.log('No hypergit remote by that name.')
        return process.exit(1)
      }
      var key = remote.url.replace('hypergit://', '')
      getHyperdb(key, function (err, db) {
        if (err) throw err
        createFork(db, function (err, newDb) {
          var key = newDb.key.toString('hex')
          createRemote('fork', 'hypergit://' + key)
          console.log('Created new remote "fork": hypergit://' + key)
        })
      })
    }
  })
}