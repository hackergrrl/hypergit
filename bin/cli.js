#!/usr/bin/env node

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

if (args._.length === 2) {
  printUsage()
  return
}

switch (args._[2]) {
  case 'create':
    getHyperdb(null, function (err, db) {
      var name = 'swarm'
      var key = db.key.toString('hex')
      spawn('git', ['remote', 'add', name, 'hypergit://' + key])
      console.log('hypergit://' + key)
    })
    break
  case 'auth':
    var key = process.argv[3]
    if (!key) {
      console.log('Must include a KEY to authorize.')
      return process.exit(1)
    }
    if (typeof key === 'string') key = Buffer.from(key, 'hex')

    getCurrentHyperdb(function (err, db) {
      if (err) throw err
      db.authorize(key, function (err) {
        if (err) console.log('Failed to authorize:', err)
        else console.log('Authorized write permissions for', key.toString('hex'))
      })
    })
    break
  case 'seed':
    // seed ALL repos
    getAllHyperdbs(function (err, dbs) {
      dbs.forEach(function (db, n) {
        console.log('Seeding', db.key.toString('hex'))
        dbs.push(db)
        var swarm = discovery(swarmDefaults())
        swarm.listen(2342 + n)
        swarmReplicate(swarm, db)
      })
    })
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

function getHyperdb (key, cb) {
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

function swarmReplicate (swarm, db) {
  var key = db.key.toString('hex')
  //console.log('id', db.local.key.toString('hex'))
  swarm.join(key)
  swarm.on('connection', function (conn, info) {
    console.log('found peer', info.id.toString('hex'))
    var r = db.replicate({live:false})
    r.pipe(conn).pipe(r) 
    r.once('end', function () {
      console.error('done replicating', info.id.toString('hex'))
    })
    r.once('error', function (err) {
      console.error('timeout with', info.id.toString('hex'))
    })
  })
}

function getAllHyperdbs (cb) {
  fs.readdir(envpaths.config, function (err, keys) {
    if (err) throw err
    var dbs = []
    var pending = 0
    keys.forEach(function (key, n) {
      pending++
      getHyperdb(key, function (err, db) {
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
