var discovery = require('discovery-swarm')
var swarmDefaults = require('dat-swarm-defaults')
var u = require('../utils')

var getAllHyperdbs = u.getAllHyperdbs

function swarmReplicate (swarm, db) {
  var key = db.key.toString('hex')
  console.log('[' + key + '] seeding')
  swarm.join(key)
  swarm.on('connection', function (conn, info) {
    console.log('['+key+'] found peer', info.id.toString('hex'))
    var r = db.replicate({live:false})
    r.pipe(conn).pipe(r)
    r.once('end', function () {
      console.error('[' + key + '] done replicating', info.id.toString('hex'))
    })
    r.once('error', function (err) {
      console.error('[' + key + '] timeout with', info.id.toString('hex'))
    })
  })
}

module.exports = function seed () {
  // seed ALL repos
  getAllHyperdbs(function (err, dbs) {
    dbs.forEach(function (db, n) {
      dbs.push(db)
      var swarm = discovery(swarmDefaults())
      swarm.listen(2342 + n)
      swarmReplicate(swarm, db)
    })
  })
}
