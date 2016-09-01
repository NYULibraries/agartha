var compile = {
  hbs : function(hbs) {
    var template = _.template('<script id="<%= id %>" type="text/x-handlebars-template"><%= body %></script>');
    return template({
      id: hbs.id,
      body: agartha.read.text(hbs.source)
    });
  }
}
