/**
 * agartha.js
 * https://github.com/NYULibraries/agartha.js
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

'use strict';

const pkg = require('./package.json');

const program = require('commander');

const path = require('path');

const readline = require('readline');

const version = pkg.version;

const _exit = process.exit;

const ERROR_CODE_ONE = 1;

// set process title
process.title = 'agartha';

// Re-assign process.exit because of commander
process.exit = exit;

// CLI
before(program, 'outputHelp', function () {
  this.allowUnknownOption();
});

program
  .version(version)
  .usage('[options] [op]');

program
  .command('craft')
  .option('-r, --relic [relic]', 'Which relic to use')
  .option('-a, --artifact [relic]', 'Which artifact to use as based')
  .option('-f, --force', 'force on non-empty directory')
  .description('Craft a site scaffold')
  .action(main);

program
  .command('forge')
  .description('Forge a relic')
  .action(forge);

program
  .parse(process.argv);

/**
* Install a before function; AOP.
*/
function before(obj, method, fn) {
  var old = obj[method];
  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */
function confirm(msg, callback) {

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(msg, (input) => {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });

}

/**
 * Graceful exit for async STDIO
 */
function exit(err, code) {

  if (err) {
    console.log(err);
  }

  var draining = 0;

  var streams = [process.stdout, process.stderr];

  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) {
      _exit(code);
    }
  }

  exit.exited = true;

  streams.forEach(function(stream) {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();

}

/**
 * Main program.
 */
function main(dir) {

  // do we need to quit?
  if (exit.exited) return;

  // what type of relic will be forge
  const relic = this.relic || 'generic';

  // app destination
  const destinationPath = dir || '.';

  // app name
  const appName = path.basename(path.resolve(destinationPath));

  // force creation of app even if destination is not empty
  const force = this.force || false;

  const agartha = require('agartha').agartha;

  // Generate site
   agartha.emptyDirectory(destinationPath, function (empty) {
     if (empty || force) {
       agartha.create(appName, destinationPath, relic);
     }
     else {
       confirm('destination is not empty, continue? [y/N] ', function (ok) {
         if (ok) {
           process.stdin.destroy();
           agartha.application(appName, destinationPath, relic);
         }
         else {
           console.error('aborting');
           exit(1);
         }
       });
     }
   });

 }

/**
* Forge program.
*/
function forge() {

  const agartha = require('agartha').agartha;

  const project = path.join(process.cwd(), 'project.json');

  if (agartha.exists(project)) {
    agartha.forge(agartha.read.json(project));
  }
  else {
    exit('Agartha can not forge. Make sure you have project.json in your project.', ERROR_CODE_ONE);
  }
}
