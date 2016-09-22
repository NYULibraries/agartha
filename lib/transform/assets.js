function assets () {

  var agartha = require('agartha').agartha;

  var destination = agartha.path.join(agartha.appBuildDir(), 'images');

  var source = agartha.path.join(agartha.appDir(), 'app', 'images');

  var ncp = require('ncp').ncp;

  ncp.limit = 16;

  ncp(source, destination, function (err) {
   if (err) return console.error(err);
  });

}

exports.assets = assets;
