/* jshint laxcomma: true */
YUI().use(
  'node',
  'event',
  'handlebars',
  'jsonp',
  'router',
  'gallery-paginator',
  'anim', function (Y) {
  'use strict';

  function a () {
    return `
    <div class="item-list flex-container">
    {{#items}}
    <article class="item" {{#if score}}data-score="{{{score}}}"{{/if}}>
      <div class="card">
        <div class="thumbs">
          <div class="clipper">
            <a href="{{../app.appRoot}}/books/{{ss_book_identifier}}/1">
              <img src="{{ss_representative_image}}" alt="" title="{{ss_title_long}}"/>
            </a>
          </div>
        </div>
        <h1 class="md_title"><a href="{{../app.appRoot}}/books/{{ss_book_identifier}}/1">{{ss_title_long}}</a></h1>
        <div class="md_authors"><span class="md_label">Author:</span> {{#each sm_author}}<span  class="md_author">{{this}}</span>{{/each}}</div>
        {{#if zm_series_data}}
        <div class="md_series">
          <span class="md_label">Series:</span>
          {{#each zm_series_data}}
            {{#json this}}
              <a class="md_series_each" href="{{../../../../app.appRoot}}/series/{{#speakingurl}}{{series}}{{/speakingurl}}">{{series}}{{#if volume_number}} v. {{volume_number}}{{/if}}</a>
            {{/json}}
          {{/each}}
        </div>
        {{/if}}
        <div><span class="md_label">Publisher:</span> {{#each sm_publisher}}<span>{{this}}</span>{{/each}}</div>
        <div><span class="md_label">Place of Publication:</span> {{ss_publocation}}</div>
        <div><span class="md_label">Date of Publication:</span> {{ss_pubdate}}</div>
        <div class="md_subjects">
          <span class="md_label">Subject:</span>
          {{#each zm_subject}}
            {{#json this}}
              <a class="md_subject" href="{{../../../app.appRoot}}/subjects/{{tid}}">{{name}}</a>
            {{/json}}
          {{/each}}
        </div>
        <div class="md_partner">
          <span class="md_label">Provider:</span>
          {{#each zm_partner}}
            {{#json this}}
              <a class="md_provider" data-code="{{code}}" data-id="{{nid}}" href="{{../../../app.appRoot}}/providers/{{nid}}">{{name}}</a>
            {{/json}}
          {{/each}}
        </div>
      </div>
    </article>
    {{/items}}
    <article class="item"></article>
    <article class="item"></article>
    </div>
    `;
  }

  var itemsTemplate = Y.Handlebars.compile(a());

  var router = new Y.Router();

  var transactions = [];

  function HandlebarsHelpers () {
    function json ( context, options ) {
    	return options.fn ( JSON.parse ( context ) );
    }
    function speakingurl ( context, options ) {
    	return window.getSlug ( this.label ) ;
    }
    return {
      json : json,
    	speakingurl : speakingurl
   };
  }

  Y.Object.each(HandlebarsHelpers(), function ( helper , key ) { Y.Handlebars.registerHelper ( key , helper ) } ) ;

  function getRoute () {
    var pageQueryString = getParameterByName('page');
    var sortQueryString = getParameterByName('sort')
    var page = ( pageQueryString ) ? pageQueryString : 1
    var route = router.getPath() + '?page=' + page;
    if (sortQueryString) {
      route = route + '&sort=' + sortQueryString;
    }
    return route;
  }

  function getRouteChangedParameters () {
    // when filter or sort is changed, we should go back to the first page
    var sortQueryString = getParameterByName('sort');
    var route = router.getPath();
    if (sortQueryString) {
      route = route + '&sort=' + sortQueryString;
    }
    return route;
  }

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    var results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  router.route(router.getPath(), function(req) {
    var node = Y.one('[data-name="items"]');
    var data = node.getData();
    var rows = (req.query.rows) ? req.query.rows : ((data.rows) ? data.rows : 10);
    var sort = (req.query.sort) ? req.query.sort : ((data.sort) ? data.sort : Y.one('#browse-select').get('value'));
    var page = (req.query.page) ? parseInt( req.query.page, 10) : 0;
    var start =  0;
    if (page <= 1) {
      start = 0;
    }
    else {
      start = (page * rows) - rows;
    }
    initRequest ({
      container : node,
      start : start,
      page : page,
      rows : rows,
      sort : sort
    });
  });

  function onSelectChange() {
    router.replace( getRouteChangedParameters() );
  }

  function onFailure(response, args) {
    var data = args.container.getData()
    var requestError = data.requesterror;
    if (!requestError) {
      args.container.setAttribute('data-requesterror', 1);
      requestError = 1;
    }
    else {
      requestError = parseInt(requestError, 10) + 1;
      args.container.setAttribute('data-requesterror', requestError);
    }
    /** there try 3 more times before giving up */
    if (requestError < 3) {
      router.replace(getRoute ());
    }
    else {
      Y.log('onFailure: there was a problem with this request');
    }
  }

  function onTimeout() {
    onFailure();
  }

  function update(state) {
    this.setPage(state.page, true)
    this.setRowsPerPage(state.rowsPerPage, true)
    this.setTotalRecords(state.totalRecords, true);
    router.save(router.getPath() + '?page=' + state.page);
  }

  function initPaginator( page, totalRecords, rowsPerPage ) {
    Y.one('#paginator').empty();
    var paginator = new Y.Paginator({
      totalRecords: totalRecords,
      rowsPerPage: rowsPerPage,
      initialPage : page,
      template: '{FirstPageLink} {PageLinks} {NextPageLink}'
    });
    paginator.on('changeRequest', update);
    if (totalRecords > rowsPerPage) {
      paginator.render('#paginator');
    }
  }

  function onSuccess(response, args) {
    try {
      var node = args.container;
      var resultsnum = Y.one('.resultsnum');
      var page = ( args.page ) ? args.page : 1;
      var numfound = parseInt(response.response.numFound, 10);
      var numfoundNode = resultsnum.one('.numfound');
      var start = parseInt(response.response.start, 10);
      var displayStart = (start < 1) ? 1 : (start + 1);
      var startNode = resultsnum.one('.start');
      var docslengthNode = resultsnum.one('.docslength');
      var docslength = parseInt(response.response.docs.length, 10);
      var appRoot = Y.one('body').getAttribute('data-app');
      var rows = args.rows;
      /* Re-init pagination each time, since number of results changes */
      initPaginator(page , numfound, rows);
      node.setAttribute('data-numFound', numfound);
      node.setAttribute('data-start', start);
      node.setAttribute('data-docsLength', docslength);
      startNode.set('innerHTML', displayStart);
      docslengthNode.set('innerHTML', start + docslength);
      numfoundNode.set( 'innerHTML', numfound );
      node.append(
        itemsTemplate({
          items : response.response.docs,
          app: { appRoot : appRoot }
        })
      );
      args.container.setAttribute('data-requesterror', 0);
      Y.one('body').removeClass('io-loading');
    }
    catch (e) {
      Y.log(e);
    }
  }

  function initRequest(options) {
    var start = 0;
    var page = 0;
    var sortData = Y.one('#browse-select :checked');
    var sortBy = sortData.get('value');
    var sortDir = sortData.getAttribute("data-sort-dir");
    var data = options.container.getData();
    var source = Y.one('.widget.items').getAttribute('data-source');
    var fl = (data.fl) ? data.fl : '*';
    var rows = (data.rows) ? data.rows : 10;
    var fq = [];
    Y.one('body').addClass('io-loading');
    /** find all data-fq and push the value into fq Array*/
    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
        if (prop.match('fq-')) {
          fq.push(prop.replace('fq-', '') + ':' + data[prop]);
        }
      }
    }
    if (options.page) {
      page = parseInt(options.page, 10);
    }
    if (options.start) {
      start = parseInt(options.start, 10);
    }
    if (options.rows) {
      rows = parseInt(options.rows, 10);
    }
    source = source
           + "?"
           + "wt=json"
           + "&json.wrf=callback={callback}"
           + "&fl=" + fl
           + "&fq=" + fq.join("&fq=")
           + "&rows=" + rows
           + "&start=" + start
           + "&sort=" + sortBy + "%20" + sortDir;
    options.container.empty();
    Y.jsonp(source, { on: { success: onSuccess, failure: onFailure, timeout: onTimeout }, args: options, timeout: 3000 });
  }

  router.replace(getRoute());

  // Sorting dropdown
  Y.one('body').delegate('change', onSelectChange, '#browse-select');

});
