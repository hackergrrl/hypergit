#!/usr/bin/env node

var path = require('path')
var args = require('minimist')(process.argv)
var create = require('../src/commands/create')
var seed = require('../src/commands/seed')
var web = require('../src/commands/web')
var id = require('../src/commands/id')
var fork = require('../src/commands/fork')
var service = require('../src/commands/service')
var utils = require('../src/utils')

if (args._.length === 2) {
  utils.printUsage()
  return
}

switch (args._[2]) {
  case 'create':
    create()
    break
  case 'service':
    if (args._.length === 3) {
      utils.printUsage()
      return
    }
    service(args._[3])
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
    utils.printUsage()
    break
}

