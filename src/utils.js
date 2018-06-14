var fs = require('fs')
var path = require('path')
var hyperdb = require('hyperdb')
var crypto = require('hypercore/lib/crypto')
var spawn = require('child_process').spawnSync;
var envpaths = require('env-paths')('hypergit')
var gitconfig = require('gitconfiglocal')

exports.createRemote = function createRemote (name, url) {
  spawn('git', ['remote', 'add', name, url]);
}

exports.getHyperdb = function getHyperdb (key, cb) {
  var db
  if (key === null) {
    // create
    var keypair = crypto.keyPair()
    key = keypair.publicKey.toString('hex')
    db = hyperdb(path.join(envpaths.config, key), key, {secretKey: keypair.secretKey})
  } else {
    // existing
    db = hyperdb(path.join(envpaths.config, key), key)
  }
  db.ready(function () {
    cb(null, db)
  })
}

exports.getAllHyperdbs = function getAllHyperdbs (cb) {
  fs.readdir(envpaths.config, function (err, keys) {
    if (err) throw err
    var dbs = []
    var pending = 0
    keys.forEach(function (key, n) {
      pending++
      exports.getHyperdb(key, function (err, db) {
        if (err) return done()
        dbs.push(db)
        done()
      })
    })
    function done () {
      if (--pending) return
      cb(null, dbs)
    }
  })
}

exports.getHypergitRemotes = function getHypergitRemotes (cb) {
  gitconfig('.', function (err, config) {
    if (err) return cb(err)
    var remotes = Object.keys(config.remote)
      .map(function (key) {
        var remote = config.remote[key]
        remote.name = key
        return remote
      })
      .filter(function (remote) {
        return remote.url.startsWith('hypergit://')
      })
    cb(null, remotes)
  })
}
