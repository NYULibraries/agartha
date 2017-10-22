/* jshint laxcomma: true */
YUI().use('node', 'imageloader', function(Y) {
  'use strict';
  var foldGroup = new Y.ImgLoadGroup({
      foldDistance: 30
  });
  Y.all('.imgload').each(function(node) {
    var data = node.getData();
    foldGroup.registerImage({ domId: node.get('id'), srcUrl: data.src });
  });
});
