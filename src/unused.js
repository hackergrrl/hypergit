var fs = require('fs')
var path = require('path')
var envpaths = require('env-paths')('hypergit')
var gitconfig = require('gitconfiglocal')
var u = require('./utils')

var getHyperdb = u.getHyperdb

function hyperdir (key) {
  return path.join(envpaths.config, key)
}

exports.getCurrentHyperdb = function getCurrentHyperdb (cb) {
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

exports.ensureNoHypergit = function ensureNoHypergit (key) {
  if (fs.existsSync(hyperdir(key))) {
    console.log('A hypergit repo already exists in this directory.')
    return process.exit(1)
  }
  if (!fs.existsSync(path.join('.git', 'config'))) {
    console.log('There is no git repository here.')
    return process.exit(1)
  }
}

exports.ensureValidHypergit = function ensureValidHypergit () {
  if (!fs.existsSync(hyperdir(key))) {
    console.log('No hypergit repo exists in this directory.')
    return process.exit(1)
  }
  if (!fs.existsSync(path.join('.git', 'config'))) {
    console.log('There is no git repository here.')
    return process.exit(1)
  }
}