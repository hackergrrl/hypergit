#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var args = require('minimist')(process.argv)
var hyperdb = require('hyperdb')
var spawn = require('child_process').spawnSync

if (args._.length === 2) {
  printUsage()
  return
}

switch (args._[2]) {
  case 'create':
    ensureNoHypergit()

    var db = getHyperdb()
    db.ready(function () {
      var name = 'swarm'
      var key = db.key.toString('hex')
      spawn('git', ['remote', 'add', name, 'hypergit://' + key])
      console.log('hypergit://' + key)
    })
    break
  case 'auth':
    ensureValidHypergit()

    var key = process.argv[3]
    if (!key) {
      console.log('Must include a KEY to authorize.')
      return process.exit(1)
    }

    var db = getHyperdb()
    db.ready(function () {
      db.authorize(key, function (err) {
        if (err) console.log('Failed to authorize:', err)
        else console.log('Authorized write permissions for', key)
      })
    })
    break
  default:
    printUsage()
    break
}

function getHyperdb () {
  return hyperdb('.hypergit')
}

function ensureNoHypergit () {
  if (fs.existsSync('.hypergit')) {
    console.log('A hypergit repo already exists in this directory.')
    return process.exit(1)
  }
  if (!fs.existsSync(path.join('.git', 'config'))) {
    console.log('There is no git repository here.')
    return process.exit(1)
  }
}

function ensureValidHypergit () {
  if (!fs.existsSync('.hypergit')) {
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
