/**
 * agartha
 * https://github.com/NYULibraries/agartha
 *
 * Copyright (c) 2014 New York University, contributors
 * Licensed under the MIT license.
 */
function build () {
  const agartha = module.parent.parent.exports.agartha
  const page_path = agartha.path.join(agartha.cwd(), 'app/relics', agartha.get('relic'), 'pages')
  const pages_directory = agartha.path.join(agartha.appDir(), 'app/pages')
  const html = require('./html').html
  let sources = agartha.getDirectories(pages_directory)
  let pages = {}
  let files = []
  let module_directory
  let site_module_directory
  agartha.on('task.done', html)
  // find all the file from the original module
  for (let i = 0; i < sources.length; i++) {
    module_directory = agartha.path.join(page_path, sources[i])
    site_module_directory = agartha.path.join(pages_directory, sources[i])
    if (agartha.exists(module_directory)) {
      pages[sources[i]] = {
        files : agartha.walk(module_directory),
        original_files : agartha.walk(module_directory),
        module : { // i don't like this
          base: module_directory,
          current: site_module_directory
        }
      }
    }
    if (agartha._.isObject(pages[sources[i]])) {
      agartha._.extend(pages[sources[i]].files, agartha.walk(site_module_directory))
    }
    else {
      pages[sources[i]] = {
        files : agartha.walk(site_module_directory),
        original_files : agartha.walk(site_module_directory),
        module : {
          base: site_module_directory,
          current: site_module_directory
        }
      }
    }
  }
  /** iterate pages and transform in HTML */
  agartha._.each(pages, function (element, task) {
    if (agartha._.isUndefined(element.files['index.json'])) return
    let source = agartha.read.json(element.files['index.json'])
    source.task = task
    source.template = element.files['index.mustache']
    source.callback = element.files['index.js']
    source.files = element.files
    source.original_files = element.original_files
    source.module = element.module
    /** check if the page register a callback */
    if (agartha._.isString(source.callback)) {
      if (agartha.exists(source.callback)) {
        /** load JS module */
        const module = require(source.callback)
        /**
         * call the module with: source and project and requested callback
         * call module with parent configuration so that its possible
         * to overwrite defaults. Our modules accept a Function callback
         * we pass "html()" as the default (see html.js).
         */
        if (agartha._.isFunction(module[task])) module[task](source)
      }
    }
    /** all we need to construct this HTML page it's in the page Object */
    else {
      agartha.emit('task.done', source)
    }
  })
}

exports.build = build
