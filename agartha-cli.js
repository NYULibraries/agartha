/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

const path = require('path');

const fs = require('fs');

const agartha = require('agartha').agartha;

//const ncp = require('ncp').ncp;

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */
function create(app_name, app_path, relic) {

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

   mkdir(app_path, function() {
     mkdir(path.join(app_path, 'app'), function() {
       // loop through all the files in the relic base directory
       fs.readdir(path.join(__dirname, 'app/includes'), function(err, files) {
         if (err) {
           console.error('Could not list the directory.', err);
           process.exit(1);
         }
         files.forEach(function(file) {
           write(path.join(app_path, file), fs.readFileSync(path.join(__dirname, 'app/includes', file), 'utf-8'));
         });
       });
       mkdir(path.join(app_path, 'app'), function() {
         ncp(path.join(__dirname, 'app/relics', relic), path.join(app_path, 'app'), function (err) {
           if (err) {
             return console.error(err);
           }
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

function copy_template(from, to) {
  from = path.join(__dirname, '..', 'templates', from);
  write(to, fs.readFileSync(from, 'utf-8'));
}

/**
 * Determine if launched from cmd.exe
 */
function launchedFromCmd() {
  return process.platform === 'win32' && process.env._ === undefined;
}

//function readdirSync(directory) {
  //return fs.readdirSync(directory);
//}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
//function emptyDirectory(path, fn) {
  //var fs = require('fs');
  //fs.readdir(path, function(err, files){
    //if (err && 'ENOENT' != err.code) throw err;
    //fn(!files || !files.length);
  //});
//}

/**
 * Load template file.
 */
//function loadTemplate(name) {
  //var fs = require('fs');
  //var path = require('path');
  //return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8');
//}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */
function write(filename, str, mode) {
  var dirname = path.dirname(filename);
  try {
    fs.accessSync(dirname, fs.F_OK);
    fs.writeFileSync(filename, str, { mode: mode || 0666 });
    log(filename,'create');
  }
  catch (e) {
    mkdirp(dirname, function (err) {
      if (err) console.error(err);
      else {
        try {
          fs.writeFileSync(filename, str, { mode: mode || 0666 });
          log(dirname, 'create');
        }
        catch (e) {
          log('msg', 'error');
        }
      }
    });
  }
}

exports.agartha = agartha;
