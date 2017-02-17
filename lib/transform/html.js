/**
 * agartha
 * https://github.com/NYULibraries/agartha
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */

if (!String.prototype.format) {
    String.prototype.format = function() {
        var str = this.toString();
        if (!arguments.length)
            return str;
        var args = typeof arguments[0],
            args = (("string" == args || "number" == args) ? arguments : arguments[0]);
        for (arg in args)
            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
        return str;
    }
}

function html (data) {

  'use strict'

  const task = data.task;

  const Handlebars = require('handlebars');

  const agartha = require('agartha').agartha;

  const htmlminify = require('html-minifier').minify;

  const css = require('./sass').css;

  const global_content = agartha.read.json(agartha.path.join(process.cwd(), 'content.json'));

  let assets = null;

  var partials = {};

  var pages = [];

  var widgets = [];

  var javascriptString = '';

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

  const helpers = require('./helpers')();

  /** register Handlebars helpers */
  agartha._.each(helpers, function(helper, key) {
    Handlebars.registerHelper(key, helper);
  });

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

    var route = data.route;

    var template = data.template;

    var htmlminifyConfiguration = agartha.configurations.htmlminify();

    var uncompileTemplate = agartha.read.text(template);

    var handlebars_template = Handlebars.compile(uncompileTemplate);

    /** information about how to render the JS files in this project */
    var jsConfiguration = agartha.configurations.js();

    /** copy all of the page properties in the source */
    agartha._.extend(source, data);

    agartha._.extend(source.content, global_content)

    // just in case we don't have assets is empty and a widget wants to use it
    if (!agartha._.isObject(data.assets)) data.assets = { 'js' : [], 'hbs' : [] };

    /** load/read JSON configure file for each page in project */
    var appPages = agartha.path.join(process.cwd(), 'app/pages');

    agartha.readdirSync(appPages).forEach(function(page) {
      var filepath = agartha.path.join(appPages, page, 'index.json');
      if (agartha.exists(filepath)) {
        pages.push(agartha.read.json(filepath));
      }
    });

    /** read partials */

    /** partials can include JS files by using data-script=""
     * and the JavaScript file can be overwritten as anything else
     * in the framework. Find all the JavaScript files and add them
     * to the data.assets.js so that later on Agartha can take care of
     * adding them to the project build
     */
    agartha._.each(agartha.readdirSync(agartha.path.join(agartha.cwd(), 'app/modules/partials')), (filename) => {

      /** for now we only read Handlebars.js */
      if (!filename.match('.hbs')) return;

      var partial = '';

      var object = '';

      var widgets = '';

      var name = agartha.path.basename(filename, '.hbs');

      var partials_to_use = agartha.path.join(agartha.path.join(agartha.cwd(), 'app/modules/partials'), filename);

      // check if we are "overwriting the partial at the "task" level
      if (agartha.exists(agartha.path.join(agartha.appDir(), 'app/pages', task, filename))) {
        partials_to_use = agartha.path.join(agartha.appDir(), 'app/pages', task, filename);
      }

      else {
        if (agartha.exists(agartha.path.join(agartha.appDir(), 'app/partials', filename))) {
          partials_to_use = agartha.path.join(agartha.appDir(), 'app/partials', filename);
        }
      }

      partial = agartha.read.text(partials_to_use);

      widgets = partial.match("data-script='(.*)'");

      if (widgets && widgets[0]) {

        // write a comment to explain why I am doing this here
        object = JSON.parse(widgets[0].replace(/'/g, '').replace(/data-script=/g, ''));

        // make sure we have a JS object
        if (agartha._.isArray(object.js)) {
          data.assets.js = agartha._.union(data.assets.js, object.js);
        }

      }

      /** register Handlebars partials */
      Handlebars.registerPartial(name, partial);

    });

    // deal with assest: JavaScript, hbs templates and local CSS
    if (agartha._.isObject(data.assets)) {
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
      if (agartha._.isArray(data.assets.js)) {
        /**
         *
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
         * Widgets can also invoke JavaScript files if they include data-script attribute
         *
         */
        agartha._.each(data.assets.js, (js) => {

          var compiled = null;

          var type = jsConfiguration.build;

          var style = jsConfiguration.style;

          var template = jsConfiguration.template;

          // JS file basename
          var basename = agartha.path.basename(js);

          // hold the path to the JavaScript file that will be use
          var src = '';

          var code = '';

          // check if this it's a shared resource
          var shared = false;

          // if compressed, map output
          var map = null;

          // if compressed, map filename
          var outSourceMap = basename + ".map";

          var UglifyJS = require("uglify-js");

          var UglifyJSOptions = { fromString: true, outSourceMap: outSourceMap };

          var UglifyJSResults = '';

          // JavaScript files can be in 4 different folders
          // ------------------------------------------------
          // 1) Current module
          // 2) Base module
          // 3) Main app shared resources
          // 4) Agartha shared resources
          // 5) Fail
          // current module overwrite base module
          // 1) Current module
          if (agartha.exists(agartha.path.join(data.module.current, js))) {
            src = agartha.path.join(data.module.current, js);
          }
          // 2) Project shared resources
          else if (agartha.exists(agartha.path.join(agartha.appDir(), 'app/javascript', js))) {
            shared = true
            src = agartha.path.join(agartha.appDir(), 'app/javascript', js)
          }
          // 3) Base module
          else if (agartha.exists(agartha.path.join(data.module.base, js))) {
            src = agartha.path.join(data.module.base, js)
          }

          // 4) Agartha shared resources
          else if (agartha.exists(agartha.path.join(agartha.cwd(), 'app/modules/javascript', js))) {
            shared = true;
            src = agartha.path.join(agartha.cwd(), 'app/modules/javascript', js)
          }

          // 5) Javascript file does not exists, continue
          // create a log in the HTLM file with a message?
          else {

             agartha.log("Javascript file {js} not found.".format({js : js}), 'error')

            return

          }

          // if this it's a "shared" resource and already exists, continue (no need to write again)
          // if (shared && agartha.exists(agartha.path.join(agartha.appBuildDir(), 'js', basename)) && type === 'external') return;

          // Javascript as-is (expanded)
          code = agartha.read.text(src)

          // check if we need to compress the Javascript file
          if (style === 'compressed') {
            UglifyJSResults = UglifyJS.minify(code, UglifyJSOptions)
            // minified output
            code = result.code
            //minified map output
            map = result.map
          }

          if (!agartha.exists(agartha.path.join(agartha.appBuildDir(), 'js', basename))) {
            // Copy the Javascript file in the public directory
            agartha.write(agartha.path.join(agartha.appBuildDir(), 'js', basename), code)
          }

          if (type === 'external') {
            // check if this JavaScript file overwrite a base file is so, link to this one
            code = agartha.get('appUrl') + '/' + agartha.path.join('js', basename)
          }

          source.closure += agartha._.template(template[type])({ src: code, now: agartha.timespan })

        });

      }

      if (agartha._.isObject(data.assets.hbs)) {
        /** append all the templates to the body */
        agartha._.each(data.assets.hbs, function (hbs) {
          // HBS templates can be in 4 different folders
          // ------------------------------------------------
          // 1) Current module
          // 2) Base module
          // 3) Current site shared resources
          // 4) Agartha shared resources
          // 5) Fail
          // current module overwrite base module
          //if (agartha.exists(agartha.path.join(data.module.current, hbs.template))) {
            //hbs.source = agartha.path.join(data.module.current, hbs.template);
          //}
          // 1) Current module
          if (agartha.exists(agartha.path.join(data.module.current, hbs.template))) hbs.src = agartha.path.join(data.module.current, hbs.template)

          // 2) Base module
          else if (agartha.exists(agartha.path.join(data.module.base, hbs.template))) hbs.src = agartha.path.join(data.module.base, hbs.template)

          // 3) Javascript file does not exists, continue
          else return

          source.closure += compile.hbs(hbs)

        })
      }
    }

    /** CSS / SASS */
    source.css = css(agartha)

    /** array to hold the menu object */
    source.menu = []

    /** build the menu object */
    agartha._.each(pages, function (page, index) {
      if (agartha._.isArray(pages[index].menu)) {
        agartha._.each(pages[index].menu, function (menu) {
          let weight = menu.weight
          if (!agartha._.isEmpty(source.menu[weight])) {
            weight = source.menu.length + 1
          }
          source.menu[weight] = {
            label: menu.label,
            status: 'active',
            route: pages[index].route.replace('/index.html', ''),
            page: index,
            weight: weight
          }
        })
      }
    })
    /** clean the menu object of empty values that can "exist" becuase of weight */
    source.menu = agartha._.reject(source.menu, (menu) => {
      return agartha._.isUndefined(menu)
    })
    function iterate (obj) {
      let htmlString = ''
      for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
          if (typeof obj[property] === 'object') iterate(obj[property])
          else if (property === 'localsource') { // if property vale its localsource; set html property and load the source
            // check if the value contain a valid file extention
            htmlString = agartha.read.text(agartha.path.join(data.module.current, obj[property]))
            if (agartha._.isEmpty(htmlString)) {
              htmlString = 'Unable to read ' + agartha.path.join(data.module.current, obj[property])
              agartha.log(htmlString, 'warning')
            }
            obj.html = htmlString
          }
          // not implemented but will be good to accpet an URL and
          // load data (request) as PJAX. Work on this
          else if (property === 'pjax') {
            htmlString = 'Using PJAX as datasource is not implemented at the moment'
            agartha.log(htmlString, 'warning')
            obj.html = htmlString
          }
        }
      }
    }
    /** this spaghetti maps the widgets to the task and load data Object if type is not local. */
    /**  @TODO: REMOVE! */
    if (source.content) {
      iterate(source.content);
      agartha._.each(source.content, function(content, a) {
        agartha._.each(source.content[a], function(pane, b) {
          if (!agartha._.isUndefined(source.content[a][b].widgets)) {
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
                  }
                }
                /** if you care about placement in specific scenario */
                source.content[a][b][widget] = spaghetti
                /** as array to loop by weight */
                source.content[a][b].raw.push(spaghetti)
              })
            }
          }
        })
      })
    }
    agartha.log('Transforming {route}'.format({route: route}), 'status')
    if (data.htaccess) {
      let rewriteBaseTemplate = Handlebars.compile(agartha.read.text(agartha.path.join(agartha.cwd(), 'app/shared/views/htaccess.hbs')))
      let rewriteBasePath = source.appRoot + route.replace('/index.html', '')
      let htaccessFilename = agartha.appBuildDir() + route.replace('/index.html', '') + '/.htaccess'
      /** write .htaccess file */
      if (rewriteBasePath) {
        agartha.write(htaccessFilename, rewriteBaseTemplate({ rewriteBase: rewriteBasePath }))
      }
    }
    // write HTML file
    agartha.write(agartha.path.join(agartha.appBuildDir(), route), htmlminify(handlebars_template(source), htmlminifyConfiguration))
  }
  catch (error) {
    console.error(error)
  }
}

exports.html = html
