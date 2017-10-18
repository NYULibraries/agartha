function series (data) {

  var agartha = require('agartha').agartha;

  // https://github.com/pid/speakingurl
  var getSlug = require('speakingurl');

  // https://github.com/mdevils/node-html-entities
  var Entities = require('html-entities').AllHtmlEntities;

  var entities = new Entities();

  var route = data.route;

  var template = data.template;

  var datasource = agartha.get('datasource');

  var collectionCode = agartha.get('collectionCode');

  var discovery = datasource[data.datasource.subjects].url;

  // Array to hold found node
  data.content = {}

  data.content.nodes = [];

  /** Source URL template */
  // We request all nodes that are type (bundle: https://www.drupal.org/node/1261744) dlts_series
  // and match the collection code of this project. By default we sort by ss_series_label
  var compiled = agartha._.template("<%=discovery%>?fl=*&fq=bundle:dlts_series&fq=sm_series_code:<%=collectionCode%>&sort=ss_series_label%20asc&rows=1000&wt=json");

  // Use http://underscorejs.org/#template to render the URL that we will use to request data

  /** Render URL */
  var src = compiled({ collectionCode : collectionCode, discovery : discovery });

  agartha.request(src, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var series = JSON.parse(body);
      agartha._.each (series.response.docs, function(doc) {
        var identifier = doc.ss_identifier;
        if (doc.bs_status) {
          data.content.nodes.push({
        	  identifier : doc.ss_identifier,
        	  entity_id : doc.entity_id,
        	  label : doc.ss_series_label,
        	  route : getSlug(entities.decode(doc.label)),
        	  series_code : doc.sm_series_code,
        	  data : JSON.parse(doc.zs_data),
          });
        }
      });
      agartha.emit('task.done', data);
    }
  });
}

exports.series = series;
