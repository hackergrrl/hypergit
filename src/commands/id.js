var u = require('../utils')

var getHypergitRemotes = u.getHypergitRemotes
var getHyperdb = u.getHyperdb

module.exports = function idCommand () {
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
}