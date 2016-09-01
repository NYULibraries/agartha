// https://github.com/metalsmith/metalsmith

/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

 /**
  * Create application at the given directory `path`.
  *
  * @param {String} path
  */

//'use strict';

function create (app_name, app_path, relic) {
  const fs = require('fs');
  const path = require('path');
  const ncp = require('ncp').ncp;
  var wait = 3;
  relic = relic || 'generic';
  console.log();
  function complete() {
    if (--wait) return;
    var prompt = launchedFromCmd() ? '>' : '$';
    console.log();
    console.log('   to generate your site:');
    if (launchedFromCmd()) {
      console.log('     %s cd %s && agartha forge', prompt, app_name);
    }
    else {
      console.log('     %s cd %s && agartha forge', prompt, app_name);
    }
    console.log();
   }
   mkdir(app_path, () => {
     mkdir(path.join(app_path, 'app'), () => {
       // loop through all the files in the relic base directory
       fs.readdir(path.join(__dirname, 'app/includes'), (err, files) => {
         if (err) {
           console.error('Could not list the directory.', err);
           process.exit(1);
         }
         files.forEach(function(file) {
           write(path.join(app_path, file), fs.readFileSync(path.join(__dirname, 'app/includes', file), 'utf-8'));
         });
       });

       mkdir(path.join(app_path, 'app/images'), () => {
         complete();
       });

       mkdir(path.join(app_path, 'app'), () => {
         ncp(path.join(__dirname, 'app/relics', relic), path.join(app_path, 'app'), (err) => {
           if (err) return console.error(err);
         });
         complete();
       });
       complete();
     });

     var pkg = {
       appName: app_name,
       collectionCode : '',
       appUrl : '',
       appRoot : '',
       relic : 'generic',
       discovery : '',
       version: '0.0.0',
     };

     // write project.json file
     write(path.join(app_path, 'project.json'), JSON.stringify(pkg, null, 2));

     write(path.join(app_path, 'app.js'), '');

     complete();

   });
 }

 function cwd() {
   return __dirname;
 }

function copy_template (from, to) {
  const path = require('path');
  from = path.join(__dirname, '..', 'templates', from);
  write(to, fs.readFileSync(from, 'utf-8'));
}

/**
 * Determine if launched from cmd.exe
 */
function launchedFromCmd () {
  return process.platform === 'win32' && process.env._ === undefined;
}

function readdirSync (directory) {
  const fs = require('fs');
  return fs.readdirSync(directory);
}

function getDirectories (dirPath) {
  const fs = require('fs');
  const path = require('path');
  return fs.readdirSync(dirPath).filter(function(file) {
    return fs.statSync(path.join(dirPath, file)).isDirectory();
  });
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
function emptyDirectory (path, fn) {
  const fs = require('fs');
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}

function log (msg, status) {
  console.log('   \x1b[36m'+status+'\x1b[0m : ' + msg);
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */
function write (filename, str, mode) {
  const fs = require('fs');
  const path = require('path');
  const dirname = path.dirname(filename);
  const mkdirp = require('mkdirp');
  if (!exists(dirname)) {
    mkdirp(dirname, function (err) {
      if (err) console.error(err);
      else {
        try {
          fs.writeFile(filename, str, 'utf8', function() { log(filename, 'create') });
        }
        catch (error) {
          console.error(error);
        }
      }
    });
  }
  else {
    try {
      fs.writeFile(filename, str, 'utf8', function() { log(filename, 'create') });
    }
    catch (error) {
      console.error(error);
    }
  }
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir (path, fn) {
  const mkdirp = require('mkdirp');
  mkdirp(path, 0755, function (err) {
    if (err) throw err;
    console.log('   \033[36mcreate\033[0m : ' + path);
    fn && fn();
  });
}

/**
 * Forge project
 * @param {String} path
 */
function forge () {

  // custom module
  const transform = require('transform');

  transform.assets();

  transform.sass();

  transform.build();

}

function exists (filePath) {
  const fs = require('fs');
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  }
  catch (e) {
    return false;
  }
}

function walk (dir, page) {
  const fs = require('fs');
  var results = [];
  try {
    if (fs.lstatSync(dir).isDirectory()) {
      fs.readdirSync(dir).forEach(function(file) {
        results[file] = agartha.path.join(dir, file);
      });
    }
  }
  catch (err) {
    log('Error listing directory ' + dir, 'error');
  }
  return results;
}

function user () {
  return process.env.USER;
}

function appDir () {
  return process.cwd();
}

function appPages () {
  var dir = agartha.path.join(agartha.appDir(), 'app', 'pages');
  if (!agartha.exists(dir)) return [];
  return agartha.walk(dir);
}

function appBuildDir () {
  return agartha.path.join(agartha.appDir(), 'build');
}

function get (option) {
  const project = agartha.read.json(agartha.path.join(process.cwd(), 'project.json'));
  if (agartha._.isUndefined(option)) {
    return project;
  }
  else {
    if (agartha._.has(project, option)) {
      return project[option];
    }
  }
}

const agartha = (function() {
  // http://underscorejs.org
  const _ = require('underscore');
  if (!_.isObject(process.agartha)) {
    // https://nodejs.org/api/fs.html
    const fs = require('fs');
    // https://nodejs.org/api/path.html
    const path = require('path');
    // https://nodejs.org/api/events.html
    const events = require('events');
    // Create an eventEmitter object
    const eventEmitter = new events.EventEmitter();
    // https://github.com/request/request
    const request = require('request');
    // https://github.com/felixge/node-dateformat
    const dateformat = require('dateformat');

    // track start time
    const timespan = _.now();
    // read files
    const read = {
      // https://github.com/Leonidas-from-XIV/node-xml2js
      xml : require('xml2js').parseString,
      json : function (filePath) {
        try {
          return JSON.parse(this.text(filePath));
        }
        catch (error) {
          console.log(error);
        }
      },
      text : function (filePath) {
        if (exists(filePath)) {
          try {
            return fs.readFileSync(filePath, 'utf-8');
          }
          catch (error) {
            console.log(error);
          }
        }
      }
    };
    // export
    process.agartha = {
      _ : _,
      configurations : require(cwd() + '/configurations'),
      relic : function () { return get('relic') },
      appUrl : function () { return get('appUrl') },
      forge : forge,
      mkdir : mkdir,
      cwd : cwd,
      emptyDirectory : emptyDirectory,
      readdirSync : readdirSync,
      walk : walk,
      exists : exists,
      read : read,
      user : user,
      appDir : appDir,
      appBuildDir : appBuildDir,
      log : log,
      path : path,
      write : write,
      pages: appPages,
      getDirectories: getDirectories,
      timespan : timespan,
      request : request,
      on : eventEmitter.addListener,
      emit : eventEmitter.emit,
      dateformat : dateformat,
      get : get
    };
  }
  return process.agartha;
}());

exports.agartha = agartha;
