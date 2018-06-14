var spawn = require('child_process').spawnSync;
var crypto = require('hypercore/lib/crypto')
var hyperdb = require('hyperdb')
var path = require('path')
var envpaths = require('env-paths')('hypergit')

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
