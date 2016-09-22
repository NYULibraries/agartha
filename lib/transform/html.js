/**
 * agartha
 * https://github.com/NYULibraries/agartha
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

function html(data) {

  'use strict';

  const Handlebars = require('handlebars');

  const agartha = require('agartha').agartha;

  var HandlebarsHelpers = () => {
    function json ( context, options ) {
      return options.fn ( JSON.parse ( context ) );
    }
    function speakingurl ( context, options ) {
  	var getSlug = require('speakingurl');
      return getSlug ( this.label ) ;
    }
    return {
      json : json,
      speakingurl : speakingurl
    } ;
  }

  // var HandlebarsHelpers = require('handlebars-helpers');

  var htmlminify = require('html-minifier').minify;

  var css = require(__dirname + '/sass').css;

  var assets = null;

  var partials = {};

  var pages = [];

  var widgets = [];

  var javascriptString = '';

  var task = data.task;

  /** read project configuration object */
  var source = agartha.get();

  var compile = {
    hbs : function(hbs) {
      var template = agartha._.template('<script id="<%= id %>" type="text/x-handlebars-template"><%= body %></script>');
      return template({
        id: hbs.id,
        body: agartha.read.text(hbs.source)
      });
    }
  }

  try {

    /** string that holds JavaScript and handlebars templates */
    source.closure = '';

    // Assests can be in 4 different directories
    // ------------------------------------------------
    // 1) Current module
    // 2) Base module
    // 3) Current site shared resources
    // 4) Agartha shared resources
    // 5) Fail
    var current_module = data.module.current;

    var base_module = data.module.base;

    var current_site_shared_resources = agartha.path.join(agartha.appDir(), 'build');

    var agartha_shared_resources = agartha.path.join(agartha.cwd(), 'app/shared');

    var route = data.route;

    var template = data.template;

    var htmlminifyConfiguration = agartha.configurations.htmlminify();

    var uncompileTemplate = agartha.read.text(template);

    var handlebars_template = Handlebars.compile(uncompileTemplate);

    var agarthaPartialsDir = agartha.path.join(agartha.cwd(), 'app/modules/partials');

    var agarthaPartials = agartha.readdirSync(agarthaPartialsDir);

    /** information about how to render the JS files in this project */
    var jsConfiguration = agartha.configurations.js();

    if (agartha._.isObject(data.assets)) {
      assets = data.assets;
    }

    /** copy all of the page properties in the source */
    agartha._.extend(source, data);

    /** register Handlebars helpers */
    agartha._.each(HandlebarsHelpers(), function(helper, key) {
      Handlebars.registerHelper(key, helper);
    });

    /** load/read JSON configure file for each page in project */
    var appPages = agartha.path.join(process.cwd(), 'app/pages');

    agartha.readdirSync(appPages).forEach(function(page) {
      var filepath = agartha.path.join(appPages, page, 'index.json');
      if (agartha.exists(filepath)) {
        pages.push(agartha.read.json(filepath));
      }
    });

    // deal with assest: JavaScript, hbs templates and local CSS
    if (agartha._.isObject(assets)) {
      /** JS files */
      /**
       * We allow to configure the app to use: compressed or expanded (default
       * to expanded for development purposes). The app can also be configure to
       * host the JavaScript files "inline" or "external" (default to expanded
       * for development purposes).
       *
       * In production enviorments we want to set the app to use the compressed
       * Javascript file and host it inline (in the HTML body of the page)
       *
       * in order to use Javascripts files, the file must be specify using the
       * assest object in index.json
       *
       */
      if (agartha._.isArray(assets.js)) {
        /**
         * Javascripts files are now listed as array in index.json as
         * part of the assest object.
         *
         * e.g.,
         *  "assets" : {
         *     "js" : [
         *       "commons.js",
         *       "crossframe.js",
         *       "books.js"
         *     ]
         *   }
         *
         */
        agartha._.each(assets.js, function(js) {
          var compiled = null;
          var type = jsConfiguration.js.build;
          var style = jsConfiguration.js.style;
          var template = jsConfiguration.template;
          // JavaScript files can be in 4 different folders
          // ------------------------------------------------
          // 1) Current module
          // 2) Base module
          // 3) Main app shared resources
          // 4) Agartha shared resources
          // 5) Fail
          // current module overwrite base module

          // hold the path to the JavaScript file that will be use
          var src = '';

          // check if this it's a shared resource
          var shared = false;

          // 1) Current module
          if (agartha.exists(agartha.path.join(current_module, js))) src = agartha.path.join(current_module, js);

          // 2) Base module
          else if (agartha.exists(agartha.path.join(base_module, js))) src = agartha.path.join(base_module, js);

          // 3) Main app shared resources, set "shared" to true
          else if (agartha.exists(agartha.path.join(agartha_shared_resources, 'javascript', js))) src = agartha.path.join(agartha_shared_resources, 'javascript', js), shared = true;

          // I need to write the test for step 4

          // 5) Javascript file does not exists, continue
          // create a log in the HTLM file with a message?
          // agartha.log('Javascript file ' + js + ' not found.', 'error');
          else return;

          // app/shared/javascript/

          // JS file basename
          var basename = agartha.path.basename(src);

          // if this it's a "shared" resource and already exists, continue (no need to write again)
          if (shared && agartha.exists(agartha.path.join(agartha.appBuildDir(), 'js', basename)) && type === 'external') return;

          // Javascript as-is (expanded)
          var code = agartha.read.text(src);

          // if compressed, map output
          var map = null;

          // if compressed, map filename
          var outSourceMap = basename + ".map";

          // check if we need to compress the Javascript file
          if (style === 'compressed') {
            var UglifyJS = require("uglify-js");
            var result = UglifyJS.minify(code, { fromString: true, outSourceMap: outSourceMap });
                code = result.code; // minified output
                map = result.map; //minified map output
          }

          // Copy the Javascript file in the public directory
          agartha.write(agartha.path.join(agartha.appBuildDir(), 'js', basename), code);

          if (type === 'external') {
            // check if this JavaScript file overwrite a base file is so, link to this one
            code = agartha.get('appUrl') + '/' + agartha.path.join('js', basename);
          }

          source.closure += agartha._.template(template[type])({ src : code, now : agartha.timespan });

        });
      }
      if (agartha._.isObject(assets.hbs)) {
        /** append all the templates to the body */
        agartha._.each(assets.hbs, function(hbs) {
          // HBS templates can be in 4 different folders
          // ------------------------------------------------
          // 1) Current module
          // 2) Base module
          // 3) Current site shared resources
          // 4) Agartha shared resources
          // 5) Fail
          // current module overwrite base module
          //if (agartha.exists(agartha.path.join(current_module, hbs.template))) {
            //hbs.source = agartha.path.join(current_module, hbs.template);
          //}
          // 1) Current module
          if (agartha.exists(agartha.path.join(current_module, hbs.template))) hbs.src = agartha.path.join(current_module, hbs.template);

          // 2) Base module
          else if (agartha.exists(agartha.path.join(base_module, hbs.template))) hbs.src = agartha.path.join(base_module, hbs.template);

          // 3) Javascript file does not exists, continue
          else return;

          source.closure += compile.hbs(hbs);

        });
      }
    }

    /** CSS / SASS */
    source.css = css(agartha);

    /** array to hold the menu object */
    source.menu = [];

    /** build the menu object */
    agartha._.each(pages, function(page, index) {
      if (agartha._.isArray(pages[index].menu)) {
        agartha._.each(pages[index].menu, function(menu) {
          source.menu[menu.weight] = {
            label: menu.label,
            status: 'active',
            route: pages[index].route.replace('/index.html', ''),
            page: index,
            weight: menu.weight
          };
        });
      }
    });

    /** clean the menu object of empty values that can "exist" becuase of weight */
    source.menu = agartha._.reject(source.menu, function(menu) { return agartha._.isUndefined(menu) });

    /**
    agartha._.each ( widgets, function ( widget, name ) {
      source.widgets[name] = {};
      agartha._.extend(source.widgets[name], widget) ;
      if ( widget.sourceType === 'json' ) {
    	source.widgets[name].data = grunt.file.readJSON(agartha.cwd() + '/' + widget.source);
      }
      else if ( widget.sourceType === 'iframe' ) {
        source.widgets[name].data = { source : source.widgets[name].source }
      }
    } ) ;
    */

    function iterate(obj) {
      for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
          if (typeof obj[property] == "object") iterate(obj[property]);
          else if (property == 'localsource') { // if property vale its localsource; set html property and load the source
            // check if the value contain a valid file extention
            obj.html = agartha.read.text(agartha.path.join(current_module, obj[property]));
          }
        }
      }
    }

    /** this spaghetti maps the widgets to the task and load data Object if type is not local. */
    if (source.content) {
      iterate(source.content);
      agartha._.each(source.content, function(content, a) {
        agartha._.each(source.content[a], function(pane, b) {
          if (agartha._.isArray(source.content[a][b].widgets)) {
            source.content[a][b].raw = [];
            agartha._.each (source.content[a][b].widgets, function(widget, c) {
              var spaghetti = {};
              var sourceType = widgets[source.content[a][b].widgets[c]].sourceType;
              if (sourceType === 'json') {
                spaghetti = {
                  label : widget,
                  widget : widgets[source.content[a][b].widgets[c]],
                  data : agartha.read.json(agartha.path.join(agartha.cwd(), widgets[source.content[a][b].widgets[c]].source))
                };
              }
              /** if you care about placement in specific scenario */
              source.content[a][b][widget] = spaghetti;
              /** as array to loop by weight */
              source.content[a][b].raw.push(spaghetti);
            });
          }
        });
      });
    }

    /** read partial */
    agartha._.each(agarthaPartials, function(filename, index) {

      if (!filename.match('.hbs')) return;

      var partial = agartha.read.text(agartha.path.join(agarthaPartialsDir, filename));

      var matchWidgetsRegEx = "data-script='(.*)'";

      var matchWidgets = partial.match(matchWidgetsRegEx);

      var toJSON = '';

      var javascriptString = '';

      var closure = '';

      var name = agartha.path.basename(filename, '.hbs')

      // @TODO: come back to here and fix this aof1
      if (matchWidgets && matchWidgets[0]) {
        toJSON = matchWidgets[0];
        toJSON = toJSON.replace(/'/g, '').replace(/data-script=/g, '');
        toJSON = JSON.parse(toJSON);
        if (agartha._.isObject(toJSON.js)) {
            agartha._.each(toJSON.js, function(js) {
              if (jsConfiguration.js.style == 'compressed') {
                var js_filename = agartha.path.basename(js, agartha.path.extname(js)) + '.min' + agartha.path.extname(js);
                if (agartha.exists(agartha.path.join(agartha.appBuildDir(), 'js', js_filename))) {
                  javascriptString += '<script>' + agartha.read.text(agartha.path.join(agartha.cwd(), 'build/js', js_filename)) + '</script>';
                }
              }
              else {
                if (agartha.exists(agartha.path.join(agartha.appBuildDir(), 'js', js))) {
                  javascriptString += '<script src="' + source.appUrl + '/js/' + js + '"></script>';
                }
              }
          });
        }
      }
      partials[name] = partial + javascriptString;
    });

    /** register Handlebars partials */
    agartha._.each(partials, function(partial, key) { Handlebars.registerPartial(key, partial) });

    agartha.log('Transforming ' + route, 'status');

    if (data.htaccess) {
      var rewriteBaseTemplate = Handlebars.compile(agartha.read.text(agartha.path.join(agartha.cwd(), 'app/shared/views/htaccess.hbs')));
      var rewriteBasePath = source.appRoot + route.replace('/index.html', '');
      var htaccessFilename = agartha.appBuildDir() + route.replace('/index.html' , '') + '/.htaccess' ;
      /** write .htaccess file */
      if (rewriteBasePath) {
        agartha.write(htaccessFilename, rewriteBaseTemplate({ rewriteBase : rewriteBasePath }));
      }
    }
    // write HTML file
    agartha.write(agartha.path.join(agartha.appBuildDir(), route), htmlminify(handlebars_template(source), htmlminifyConfiguration));
  }
  catch (error) {
    console.error(error);
  }
}

exports.html = html;
