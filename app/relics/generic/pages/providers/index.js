function providers (data) {

  'use strict';

  var agartha = require('agartha').agartha;

  var datasource = agartha.get('datasource');

  var collectionCode = agartha.get('collectionCode');

  var terms = [];

  if (agartha._.isUndefined(data.content)) {
    data.content = {};
  }

  data.content.terms = [];

  function step1 () {
    const url = datasource[data.datasource.viewer].url;
    const compiled = agartha._.template("<%=url%>/sources/field/field_partner");
    // Use http://underscorejs.org/#template to render the URL that we will use to request data
    const src = compiled({ url : url });
    /** Use Viewer's API endpoint to collect partners */
    /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_subject */
    agartha.request(src, function (error, response, data) {
      if (error) return;
      else agartha.emit('task.step.two', data);
    });
  }

  function step2 (response) {
    const documents = JSON.parse(response);
    agartha._.each(documents, function (document) {
      terms.push({'label' : document.value, 'nid' : document.raw_value});
    });
    agartha.emit('task.step.three');
  }

  function step3 () {
    const url = datasource[data.datasource.discovery].url;
    const compiled = agartha._.template("<%=url%>?wt=json&fq=sm_collection_code:<%=collectionCode%>&rows=0&facet=true&facet.field=sm_provider_label");
    const src = compiled({ url : url, collectionCode : collectionCode });    
    /** Use Viewer's API endpoint to collect partners */
    /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_partner */
    // http://dev-discovery.dlib.nyu.edu:8080/solr3_discovery/stage/select?wt=json&fq=sm_collection_code:awdl&rows=0&facet=true&facet.field=sm_collection_partner_label
    agartha.request(src, function (error, response, data) {
      if (error) return;
      else agartha.emit('task.step.four', data);
    });

  }

  function step4 (response) {
    const documents = JSON.parse(response);
    const labels = documents.facet_counts.facet_fields.sm_provider_label;
    agartha._.each(labels, function(label, index) {
      var eq = ((index + 1) % 2);
      // Apache Solr facets in response are list as [ value, count, ... ]
      // check if index it's the label
      if (eq === 1) {
        // only accpet facets with results
        if (labels[index+1] > 0) {
          if (agartha._.isObject(agartha._.findWhere(terms, {label: label}))) {
            data.content.terms.push(agartha._.findWhere(terms, {label: label}));
          }
        }
      }
    });
    
    agartha.emit('task.done', data);

  }

  agartha.on('task.step.one', step1);

  agartha.on('task.step.two', step2);

  agartha.on('task.step.three', step3);

  agartha.on('task.step.four', step4);

  agartha.emit('task.step.one');

}

exports.providers = providers;
