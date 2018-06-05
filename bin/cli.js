#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var args = require('minimist')(process.argv)
var hyperdb = require('hyperdb')

if (args._.length === 2) {
  printUsage()
  return
}

switch (args._[2]) {
  case 'create':
    if (fs.existsSync('.hypergit')) {
      console.log('A hypergit repo already exists in this directory.')
      return process.exit(1)
    }

    var db = hyperdb('.hypergit')
    db.ready(function () {
      console.log('hypergit://' + db.key.toString('hex'))
    })
    break
  default:
    printUsage()
    break
}

function printUsage () {
  require('fs')
    .createReadStream(path.join(__dirname, '/usage.txt'))
    .pipe(process.stdout)
}
