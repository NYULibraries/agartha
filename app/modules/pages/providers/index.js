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
    var url = datasource[data.datasource.viewer].url;
    var compiled = agartha._.template("<%=url%>/sources/field/field_partner");
    // Use http://underscorejs.org/#template to render the URL that we will use to request data
    var src = compiled({ url : url });
    /** Use Viewer's API endpoint to collect partners */
    /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_subject */
    agartha.request(src, function (error, response, data) {
      if (error) return;
      else agartha.emit('task.step.two', data);
    });
  }

  function step2 (response) {
    var documents = JSON.parse(response);
    agartha._.each(documents, function (document) {
      terms.push({'label' : document.value, 'nid' : document.raw_value});
    });
    agartha.emit('task.step.three');
  }

  function step3 () {
    var url = datasource[data.datasource.discovery].url;
    var compiled = agartha._.template("<%=url%>?wt=json&fq=sm_collection_code:<%=collectionCode%>&rows=0&facet=true&facet.field=sm_collection_partner_label");
    var src = compiled({ url : url, collectionCode : collectionCode });
    /** Use Viewer's API endpoint to collect partners */
    /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_subject */
    agartha.request(src, function (error, response, data) {
      if (error) return;
      else agartha.emit('task.step.four', data);
    });
  }

  function step4 (response) {
    var documents = JSON.parse(response);
    var labels = documents.facet_counts.facet_fields.sm_collection_partner_label;
    var count = labels.length;
    agartha._.each(labels, function(label, index) {
      var eq = ((index + 1) % 2);
      // Apache Solr facets in response are list as [ value, count, ... ]
      // check if index it's the label
      if (eq === 1) {
        // only accpet facets with results
        if (labels[index+1] > 0) {
          data.content.terms.push(agartha._.findWhere(terms, {label: label}));
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
