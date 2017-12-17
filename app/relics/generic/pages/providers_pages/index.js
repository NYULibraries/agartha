function providers_pages (data) {

  'use strict';

  const agartha = require('agartha').agartha;
  
  const _ = agartha._;

  const collectionCode = agartha.get('collectionCode');

  const datasource = agartha.get('datasource');

  const discovery = datasource.discovery.url;

  const viewer = datasource.viewer.url;
  
  const field = 'sm_provider_label';

  const template_partner_label_url = '<%= discovery %>?wt=json&fq=sm_collection_code:<%= collectionCode %>&rows=0&facet=true&facet.field=<%= field %>';
  
  var compiled_partner_label_url = _.template(template_partner_label_url);
  
  const partner_label_url = compiled_partner_label_url(
    { 
      discovery: discovery,
      collectionCode: collectionCode,
      field: field
    }
  );

  const partner_url = viewer + '/sources/field/field_partner';
  
  var terms = [];

  data.content.items.datasource = discovery;

  /** Use Viewer's API endpoint to collect partners */
  /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_subject */
  agartha.request(partner_url, (error, response, source) => {
    if (error) return;
    const documents = JSON.parse(source);
    agartha._.each(documents, (document) => {
      terms.push({'label' : document.value, 'nid' : document.raw_value});
    });
    agartha.request(partner_label_url, (error, response, source) => {
      if (error) return;
      const documents = JSON.parse(source);
      const labels = documents.facet_counts.facet_fields.sm_provider_label;
      const count = labels.length;
      const filters = data.content.items.fq;
      var destination = [];
      agartha._.each(labels, (label, index) => {
        const eq = ((index + 1) % 2);
        var provider;
        // Apache Solr facets in response are list as [ value, count, ... ]
        // check if index it's the label
        if (eq === 1) {
          // only accpet facets with results
          if (labels[index+1] > 0) {
            provider = agartha._.findWhere(terms, {label: label});
            if (provider) {
              data.route = '/providers/' + provider.nid + '/index.html',
              data.content.top.label = provider.label;
              data.title = provider.label;
              /** Add to the filters the subjects field */
              destination = [ { "filter": "sm_provider_nid", "value": provider.nid } ];
              data.content.items.fq = destination.concat(filters);
              agartha.emit('task.done', data);
            }
          }
        }
      });
    });
  });
}

exports.providers_pages = providers_pages;

