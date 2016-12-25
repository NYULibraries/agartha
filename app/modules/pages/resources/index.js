function resources(callback, options) {

  return;

  var _ = require('underscore');
  var request = require('request');
  var fs = require('fs');
  var getSlug = require('speakingurl');
  var environment = options.parent_conf.environment;
  if (environment !== 'production') environment = '*';
  var template = __dirname + '/index.mustache';
  var data = {};
  callback({
    route: '/resources/index.html',
    template: template,
    data: data
  });
}

exports.resources = resources;
