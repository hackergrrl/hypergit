var u = require('../utils')

var createRemote = u.createRemote
var getHyperdb = u.getHyperdb

module.exports = function create () {
  getHyperdb (null, function(err, db) {
    var name = 'swarm'
    var key = db.key.toString('hex')
    createRemote(name, 'hypergit://' + key)
    console.log('hypergit://' + key)
  })
}
