function series_pages(data) {

  var agartha = require('agartha').agartha;

  // https://github.com/pid/speakingurl
  var getSlug = require('speakingurl');

  // https://github.com/mdevils/node-html-entities
  var Entities = require('html-entities').AllHtmlEntities;

  var entities = new Entities();

  var discovery = agartha.get('datasource').discovery.url;

  var collectionCode = agartha.get('collectionCode');

  data.content.items.datasource = discovery;

  data.nodes = {};

  /** Source URL template */
  // We request all nodes that are type (bundle: https://www.drupal.org/node/1261744) dlts_series
  // and match the collection code of this project. By default we sort by ss_series_label
  var compiled = agartha._.template("<%=discovery%>?wt=json&fl=*&fq=bundle:dlts_series&fq=sm_series_code:<%=collectionCode%>&rows=1000&hl=off");

  // Use http://underscorejs.org/#template to render the URL that we will use to request data
  var src = compiled({ collectionCode : collectionCode, discovery : discovery });

  if (collectionCode.match('OR')) {
    collectionCode = collectionCode.replace(/[\(\)]/g, '').split(' OR ');
  }

  agartha.request(src, (error, response, body) => {

    if (error) return;

    var datasource = JSON.parse(body);

    var documents = datasource.response.docs;

    var filters = data.content.items.fq;

    agartha._.each(documents , function(doc) {

      var node = {};

      var identifier = doc.ss_identifier;

      if (agartha._.has(data, identifier)) return;

      if (!doc.bs_status) return;

      // old test: agartha._.contains(doc.sm_series_code, collectionCode)
      if (agartha._.intersection(doc.sm_series_code, collectionCode)) {

        if (!doc.zs_data) return;

        data.content.top.title = doc.ss_series_label;

        node.data = JSON.parse(doc.zs_data);

        node.label = doc.label;

        node.hash = doc.hash;

        node.identifier = doc.ss_identifier;

        node.series_code = doc.sm_series_code;

        data.content.items.fq = agartha._.union(filters, [ { 'filter' : 'sm_series_identifier', 'value' : doc.ss_identifier }, { 'filter' : 'is_ispartofseries', 'value' : 1 } ]);

        data.content.node = node;

        data.route = '/series/' + getSlug(entities.decode(node.label)) + '/index.html';

        agartha.emit('task.done', data);

      }
    });
  });
}

exports.series_pages = series_pages;
