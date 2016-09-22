/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

function sass () {

  var agartha = require('agartha').agartha;

  // https://github.com/sass/node-sass
  var sass = require('node-sass');

  var relic = agartha.get('relic');

  var app = agartha.appDir();

  var build = agartha.appBuildDir();

  var sass_configuration = agartha.configurations.sass();

  var outputStyle = sass_configuration.dist.options.style;

  var baseResult = sass.renderSync({
    file: agartha.path.join(app, 'app/sass/style.scss'),
    outputStyle: outputStyle,
    outFile: agartha.path.join(build, 'css/base.css'),
    sourceMap: true // or an absolute or relative (to outFile) path
  });

  var siteResult = sass.renderSync({
    file: agartha.path.join(app, 'app/sass/style.scss'),
    outputStyle: outputStyle,
    outFile: agartha.path.join(build, 'css/site.css'),
    sourceMap: true // or an absolute or relative (to outFile) path
  });

  // Base SASS files from the relic
  agartha.write(agartha.path.join(build, 'css/base.css'), baseResult.css.toString());
  // Leave behind a map
  agartha.write(agartha.path.join(build, 'css/base.css.map'), baseResult.map.toString());
  // Site specific SASS files
  agartha.write(agartha.path.join(build, 'css/site.css'), siteResult.css.toString());
  // Site specific map
  agartha.write(agartha.path.join(build, 'css/site.css.map'), siteResult.map.toString());

  agartha.write(agartha.path.join(build, 'css/style.css'), baseResult.css.toString() + ' ' + siteResult.css.toString());

}

function css () {

  var agartha = require('agartha').agartha;

  var css = '';

  /** Generate CSS files from SASS and return SASS configurations */
  var template_string = '';

  var compiled_template;

  var output = '';

  var sass_configurations = agartha.configurations.sass();

  var build = sass_configurations.dist.build;

  switch (build) {
    case 'inline' :
      template_string = "<style><%= css %></style>";
      break;
    default:
      template_string = '<link href="<%= css %>" rel="stylesheet" type="text/css">';
      break;
   }

   compiled_template = agartha._.template(template_string);

   // add test to check the assumptiont that style.css already exists
   switch (build) {
     case 'external' :
       css = agartha.get('appUrl') + '/css/style.css';
       break;
     default:
       css = agartha.read.text(agartha.path.join(agartha.appBuildDir(), 'css', 'style.css'));
       break;
   }

   output += compiled_template({ css : css });

   return output;

 }

exports.sass = sass;

exports.css = css;
