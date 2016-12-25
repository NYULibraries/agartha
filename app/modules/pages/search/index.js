function search (data) {

  'use strict';

  const agartha = require('agartha').agartha;

  const url = agartha.get('datasource').discovery.url;

  data.content.items.datasource = url;

  agartha.emit('task.done', data);

}

exports.search = search;
