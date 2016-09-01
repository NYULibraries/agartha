/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2016 New York University, contributors
 * Licensed under the MIT license.
 */

const fs = require('fs');

const path = require('path');

const _ = require('underscore');

function exists (filepath) {
   try {
     if (fs.accessSync(filepath, fs.F_OK)) {
       return true;
     }
   }
   catch (e) {
     return false;
   }
 }

function get (option) {
  const filepath = path.join(process.cwd(), 'project.json');
  if (exists(filepath)) {
    const project = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    if (_.isUndefined(option)) {
      return project;
    }
    else {
      if (_.has(project, option)) {
        return project[option];
      }
    }
  }
}

function htmlminify () {
  const filepath = path.join(process.cwd(), 'htmlminify.json');
  var configuration = {};
  if (exists(filepath)) {
    configuration = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return configuration;
}

function js () {
  var js_conf;
  //if ( grunt.file.isFile( __dirname + '/source/json/js.json' ) ) {
	  //js_conf = grunt.file.readJSON( __dirname + '/source/json/js.json' ) ;
  //}
  //else {
    // default JS configuration
    js_conf = {
      js : {
        build : "external", // options: inline,  external
        style : "expanded" // options: compressed, expanded
	    }
    };

  //}

  js_conf.template = {
    inline   : '<script data-timespan="<%= now %>"><%= src %></script>',
    external : '<script src="<%= src %>?n<%= now %>" defer></script>'
  };
  return js_conf;
}

/** merge with compass */
function sass () {

  // see: http://stackoverflow.com/questions/31148803/injecting-variables-during-sass-compilation-with-node

  const filepath = path.join(process.cwd(), 'sass.json');

  var configuration = {};

  if (exists(filepath)) {
    configuration = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  else {
    configuration =  {
    	dist: {
    	  options: {
          basePath : get('appUrl'),
          sassDir : path.join(process.cwd(), 'app/sass'),
          outputStyle : 'expanded',
          imagesDir : path.join('images'),
          javascriptsDir : path.join('js'),
          cssDir : path.join('css'),
          httpPath: ''
        }
      }
    }
  }

	// default SASS configuration
  sass_conf = {
      sass : {
        build : "external", // options: inline,  external
	    // build : "external", // options: inline,  external
	    // for options; see: https://github.com/gruntjs/grunt-contrib-sass
	    options : {
        style : "expanded", // options: nested, compact, compressed, expanded
        debugInfo : false,
        lineNumbers : true,
        trace: false
      }
    }
  };
  return {
    dist: {
      options: sass_conf.sass.options,
      files: { 'build/css/style.css': __dirname + '/source/sass/style.scss' },
      build : sass_conf.sass.build
    }
  };
}

function uglify () {
  function targetsCallback() {
    var targets = {};
    grunt.file.recurse(__dirname + '/source/js/', function callback (abspath, rootdir, subdir, filename) {
      if ( filename.match('.js') ) {
        var name = filename.replace('.js', '');
        targets['build/js/' + name + '.min.js'] = abspath;
      }
    });
    return targets;
  }
  return {
    options: {
      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
      compress: {}, // https://github.com/gruntjs/grunt-contrib-uglify/issues/298#issuecomment-74161370
      preserveComments: false
    },
    my_target: {
      files: targetsCallback()
    }
  };
}

//exports.uglify = uglify;
exports.sass = sass;
exports.js = js;
exports.htmlminify = htmlminify;
