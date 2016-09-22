#!/usr/bin/env node

'use strict';

// https://github.com/tj/commander.js/
var program = require('commander');

var pkg = require('./package.json');

var agartha = require('agartha').agartha;

var version = pkg.version;

var _exit = process.exit;

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
  .command('create')
  .option('-r, --relic [relic]', 'Which relic to use')
  .option('-a, --artifact [relic]', 'Which artifact to use as based')
  .option('-f, --force', 'force on non-empty directory')
  .description('Craft a site scaffold')
  .action(create);

program
    .command('forge')
    .description('Forge a project')
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
  // https://nodejs.org/api/readline.html
  var createInterface = require('readline').createInterface;
  var rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(msg, function (input) {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });
}

/**
 * Graceful exit for async STDIO
 */
function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) _exit(code);
  }
  var draining = 0;
  var streams = [process.stdout, process.stderr];
  exit.exited = true;
  streams.forEach(function(stream){
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });
  done();
}

/**
 * Main program.
 */
function create () {

  // what type of relic will be forge
  var relic = this.relic || 'generic';

  // app destination
  var destinationPath = dir || '.';

  console.log(arguments)

  return;

  // app name
  var appName = agartha.path.basename(agartha.path.resolve(destinationPath));

  // force creation of app even if destination is not empty
  var force = this.force || false;

  // Generate site
  agartha.emptyDirectory(destinationPath, (empty) => {
    if (empty || force) {
      agartha.create(appName, destinationPath, relic);
    }
    else {
      confirm('Destination is not empty, continue? [y/N] ', (ok) => {
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
function forge () {
  if (exit.exited) return;
  var project = agartha.exists(agartha.path.join(agartha.appDir(), 'project.json'));
  if (project) agartha.forge();
  else {
    agartha.log('Can not forge, make sure you have project.json in your project.', 'error');
    exit(1);
  }
}
