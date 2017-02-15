'use strict'
function assets () {
  const agartha = require('agartha').agartha
  const destination = agartha.path.join(agartha.appBuildDir(), 'images')
  const source = agartha.path.join(agartha.appDir(), 'app', 'images')
  const ncp = require('ncp').ncp
  ncp.limit = 16
  ncp(source, destination, function (err) {
    if (err) {
      return console.error(err)
    }
  })
}
exports = module.exports = assets

exports.assets = assets
