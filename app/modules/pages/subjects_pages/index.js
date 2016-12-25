function subjects_pages (data) {

  'use strict';

  const agartha = require('agartha').agartha;

  const subject_url = agartha.get('datasource').viewer.url + '/sources/field/field_subject';

  const discovery_url = agartha.get('datasource').discovery.url;

  // this module use the items widget
  if (!data.content.items) return;

  // the datasource for this module
  data.content.items.datasource = discovery_url;

  agartha.request(subject_url, (error, response, body) => {
    if (error) return;
    const documents = JSON.parse(body);
    if (documents) {
      const length = documents.length;
      const filters = data.content.items.fq;
      var index = 0;
      var destination = [];
      for (index; index < length; index++) {
        // set page title
        data.content.top.label = documents[index].value;
        /** Add to the filters the subjects field */
        destination = [ { "filter": "im_field_subject", "value": documents[index].raw_value } ];
        data.content.items.fq = destination.concat(filters);
        data.route = '/subjects/' + documents[index].raw_value + '/index.html';
        agartha.emit('task.done', data);
      }
    }
  });
}

exports.subjects_pages = subjects_pages;
