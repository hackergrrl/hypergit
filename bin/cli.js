#!/usr/bin/env node

var through = require('through2')
var fs = require('fs')
var path = require('path')
var args = require('minimist')(process.argv)
var hyperdb = require('hyperdb')
var spawn = require('child_process').spawnSync
var discovery = require('discovery-swarm')
var swarmDefaults = require('dat-swarm-defaults')
var envpaths = require('env-paths')('hypergit')
var mkdirp = require('mkdirp')
var crypto = require('hypercore/lib/crypto')
var gitconfig = require('gitconfiglocal')
var web = require('../web')
var create = require('../src/commands/create')
var seed = require('../src/commands/seed')
var u = require('../src/utils')

var createRemote = u.createRemote
var getAllHyperdbs = u.getAllHyperdbs
var getHyperdb = u.getHyperdb

if (args._.length === 2) {
  printUsage()
  return
}

switch (args._[2]) {
  case 'create':
    create()
    break
  case 'seed':
    seed()
    break
  case 'web':
    getAllHyperdbs(function (err, dbs) {
      web(dbs)
    })
    break
  case 'id':
    getHypergitRemotes(function (err, remotes) {
      if (!remotes.length) {
        console.log('No hypergit remotes on this git repo.')
        return process.exit(1)
      } else if (remotes.length === 1) {
        var key = remotes[0].url.replace('hypergit://', '')
        getHyperdb(key, function (err, db) {
          if (err) throw err
          console.log(db.local.key.toString('hex'))
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
          console.log(db.local.key.toString('hex'))
        })
      }
    })
    break
  case 'fork':
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
    break
  default:
    printUsage()
    break
}

function hyperdir (key) {
  return path.join(envpaths.config, key)
}

function getCurrentHyperdb (cb) {
  gitconfig('.', function (err, config) {
    if (err) throw err
    var remotes = Object.keys(config.remote)
      .map(function (key) {
        var remote = config.remote[key]
        remote.name = key
        return remote
      })
      .filter(function (remote) {
        return remote.url.startsWith('hypergit://')
      })

    if (!remotes.length) {
      cb(new Error('no hypergit remotes here'))
    } else if (remotes.length === 1) {
      var key = remotes[0].url.replace('hypergit://', '')
      getHyperdb(key, cb)
    } else {
      cb(new Error('multiple hypergit remotes here'))
    }
  })
}

function ensureNoHypergit (key) {
  if (fs.existsSync(hyperdir(key))) {
    console.log('A hypergit repo already exists in this directory.')
    return process.exit(1)
  }
  if (!fs.existsSync(path.join('.git', 'config'))) {
    console.log('There is no git repository here.')
    return process.exit(1)
  }
}

function ensureValidHypergit () {
  if (!fs.existsSync(hyperdir(key))) {
    console.log('No hypergit repo exists in this directory.')
    return process.exit(1)
  }
  if (!fs.existsSync(path.join('.git', 'config'))) {
    console.log('There is no git repository here.')
    return process.exit(1)
  }
}

function getHypergitRemotes (cb) {
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

function printUsage () {
  require('fs')
    .createReadStream(path.join(__dirname, '/usage.txt'))
    .pipe(process.stdout)
}

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
