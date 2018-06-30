var fs = require('fs')
var path = require('path')
var console2file = require('console2file').default
var os_service = require('os-service')
var sudo = require('sudo-prompt')
var isElevated = require('is-elevated')
var seed = require('./seed')
var utils = require('../utils')

var envpaths = utils.envpaths

function logresult (status) {
  return function (error) {
    if (error) {
      console.log(error)
    } else {
      console.log(status)
    }
  }
}

function logoutput (err, stdout, stderr) {
  if (err) {
    console.log(err)
  } else {
    if (stderr) {
      console.log(stderr)
    }
    console.log(stdout)
  }
}

function formatArgvString (argv) {
  return argv.map(x => `"${x}"`).join(' ')
}

module.exports = function service (command) {
  switch (command) {
    case 'install':
      isElevated().then(function (elevated) {
        if (elevated) {
          os_service.add("hypergit", { programArgs: ["service", "seed"] }, logresult('installed'))
        } else {
          sudo.exec(formatArgvString(process.argv), {name: 'hypergit CLI'}, logoutput)
        }
      })
      break
    case 'remove':
      isElevated().then(function (elevated) {
        if (elevated) {
          os_service.remove("hypergit", logresult('removed'))
        } else {
          sudo.exec(formatArgvString(process.argv), {name: 'hypergit CLI'}, logoutput)
        }
      })
      break
    case 'seed':
      fs.unlink(path.join(envpaths.config, 'log.txt'), () => {
        console2file({
          filePath: path.join(envpaths.config, 'log.txt'),
          timestamp: true,
          fileOnly: false
        })
        console.log('Running with CLI arguments: ' + formatArgvString(process.argv))
        os_service.run(() => os_service.stop())
        // seed ALL repos
        seed()
      })
      break
    case 'logdir':
      console.log(envpaths.config)
      break
    default:
      utils.printUsage()
      break
  }
}
