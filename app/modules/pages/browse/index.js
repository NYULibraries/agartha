function browse (data) {

  'use strict';

  var agartha = require('agartha').agartha;

  var datasource = agartha.get('datasource');

  var url = datasource[data.content.items.datasource].url;

  data.content.items.datasource = url;

  agartha.emit('task.done', data);

}

exports.browse = browse;
