var service = require('os-service')
var console2file = require('console2file').default
var seed = require('./seed')

function logresult (status) {
  return function (error) {
    if (error) {
      console.log(error)
    } else {
      console.log(status)
    }
  }
}

module.exports = function service (command) {
  switch (command) {
    case 'install':
      service.add("hypergit", { programArgs: ["service", "seed"] }, logresult('installed'))
      break
    case 'remove':
      service.remove("hypergit", logresult('removed'))
      break
    case 'seed':
      fs.unlink(path.join(envpaths.config, 'log.txt'), () => {
        console2file({
          filePath: path.join(envpaths.config, 'log.txt'),
          fileOnly: false
        })
        service.run(() => service.stop())
        // seed ALL repos
        seed()
      })
      break
  }
}
