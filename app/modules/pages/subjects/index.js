function subjects (data) {

  const agartha = require('agartha').agartha;

  const collectionCode = agartha.get('collectionCode');

  const subject_url = agartha.get('datasource').viewer.url + '/sources/field/field_subject';

  const discovery_url = agartha.get('datasource').discovery.url + '?wt=json&rows=0&facet=true&facet.field=im_field_subject&fq=sm_collection_code:' + collectionCode;;

  var drupal_terms = [];

  data.terms = [];

  /** we need the list of Drupal 7 subjects */
  /** we use Viewer's API endpoint to collect this information */
  /** Example: http://stage-dl-pa.home.nyu.edu/viewer/sources/field/field_subject */
  agartha.request(subject_url, (error, response, body) => {
    if (error) return;
    var i = 0;
    const drupal_subjects = JSON.parse(body);
    const length = drupal_subjects.length;
    for (i; i < length; i++) {
      drupal_terms.push(drupal_subjects[i]);
    }
    agartha.request(discovery_url, (error, response, body) => {
      if (error) return;
      const subjects = JSON.parse(body);
      /** Apache Solr response includes the values and the count of the values in pairs */
      agartha._.each(subjects.facet_counts.facet_fields.im_field_subject, (doc, index) => {
        if ((index + 1) % 2) {
          const term = agartha._.findWhere(drupal_terms, { raw_value: doc});
          if (term) {
            data.terms.push({ 'tid' : term.raw_value , 'label' : term.value });
          }
        }
      });
      agartha.emit('task.done', data);
    });
  });

}

exports.subjects = subjects;
