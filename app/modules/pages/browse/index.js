function browse ( callback , options ) {
  callback ({
    route: options.route,
    template: options.template,
    data: options.data,
    options: options
  });
}

exports.browse = browse;
