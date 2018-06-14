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
var create = require('../src/commands/create')
var seed = require('../src/commands/seed')
var web = require('../src/commands/web')
var id = require('../src/commands/id')
var fork = require('../src/commands/fork')
var u = require('../src/utils')

var createRemote = u.createRemote
var getHyperdb = u.getHyperdb
var getHypergitRemotes = u.getHypergitRemotes

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
    web()
    break
  case 'id':
    id()
    break
  case 'fork':
    fork()
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

function printUsage () {
  require('fs')
    .createReadStream(path.join(__dirname, '/usage.txt'))
    .pipe(process.stdout)
}
