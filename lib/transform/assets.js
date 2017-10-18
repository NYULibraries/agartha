'use strict'
function assets () {
  const agartha = module.parent.parent.exports.agartha
  const join = agartha.path.join
  const destination = join(agartha.appBuildDir(), 'images')
  const source = join(agartha.appDir(), 'app', 'images')
  const ncp = require('ncp').ncp
  ncp.limit = 16
  ncp(source, destination, (err) => {
    if (err) return console.error(err)
  })
}
exports = module.exports = assets
exports.assets = assets
