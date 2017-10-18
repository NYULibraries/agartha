/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

function sass () {
  // https://github.com/sass/node-sass
  const sass = require('node-sass')
  const agartha = module.parent.parent.exports.agartha
  const app = agartha.appDir()
  const build = agartha.appBuildDir()
  const join = agartha.path.join
  const sassConfiguration = agartha.configurations.sass()  
  const outputStyle = sassConfiguration.dist.options.style  
  const stringReplacement = "asset-base: '" + agartha.appUrl() + "';"  
  const re = /asset-base: '.*';/gi
  let sassVariable = agartha.read.text(join(agartha.appDir(), 'app/sass', '_bootstrap-variables.scss'))
      sassVariable = sassVariable.replace(re, stringReplacement)
  agartha.write(join(agartha.appDir(), 'app/sass', '_bootstrap-variables.scss'), sassVariable, 'utf8', () => {
    let baseResult = sass.renderSync({
      file: join(app, 'app/sass/style.scss'),
      outputStyle: outputStyle,
      outFile: join(build, 'css/base.css'),
      sourceMap: true // or an absolute or relative (to outFile) path
    })
    let siteResult = sass.renderSync({
      file: join(app, 'app/sass/style.scss'),
      outputStyle: outputStyle,
      outFile: join(build, 'css/site.css'),
      sourceMap: true // or an absolute or relative (to outFile) path
    })
    // Base SASS files from the relic
    agartha.write(join(build, 'css/base.css'), baseResult.css.toString())    
    // Leave behind a map
    agartha.write(join(build, 'css/base.css.map'), baseResult.map.toString())    
    // Site specific SASS files
    agartha.write(join(build, 'css/site.css'), siteResult.css.toString())    
    // Site specific map
    agartha.write(join(build, 'css/site.css.map'), siteResult.map.toString())    
    agartha.write(join(build, 'css/style.css'), baseResult.css.toString() + ' ' + siteResult.css.toString())
  })
}

function css () {
  const agartha = process.agartha
  let css = ''
  /** Generate CSS files from SASS and return SASS configurations */
  let templateString = ''
  let compiledTemplate
  let output = ''
  let sassConfigurations = agartha.configurations.sass()
  let build = sassConfigurations.dist.build
  switch (build) {
    case 'inline':
      templateString = '<style><%= css %></style>'
      break
    default:
      templateString = '<link href="<%= css %>" rel="stylesheet" type="text/css">'
      break
  }
  compiledTemplate = agartha._.template(templateString)
  // add test to check the assumptiont that style.css already exists
  switch (build) {
    case 'external' :
      css = agartha.get('appUrl') + '/css/style.css'
      break
    default:
      css = agartha.read.text(agartha.path.join(agartha.appBuildDir(), 'css', 'style.css'))
      break
  }
  output += compiledTemplate({ css: css })
  return output
}

exports.sass = sass

exports.css = css
