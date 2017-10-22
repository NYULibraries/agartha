function front (data) {
  'use strict'
  // Agartha should be in in the process Object by now.
  // if not, we are not running inside Agartha CLI; kill
  if (process.agartha === undefined) process.exit()
  const agartha = process.agartha
  function* steps () {
    yield
    agartha.emit('task.done', data)
  }
  function Content () {}
  Content.prototype.body = (generator) => {
    data.content.featured = { 'docs' : [] }
    const discovery = agartha.discovery()
    let query = discovery.query()
      .addParams({ wt: 'json' })
      .fq({
        'field': 'sm_collection_code', 
        'value': agartha.get('collectionCode') 
      })
      .fl('score,ss_book_identifier,ss_title_long')
      .start(0)
      .rows(12)
      .sort({'iass_timestamp': 'desc'})
    discovery.search(query, (err, result) => {
      console.log(result)
      if (err) {
        console.log(error)
        return
      }
      let docs = result.response.docs
      let length = docs.length
      agartha._.each(docs, (doc) => {
        length--
        doc.url = agartha.path.join(agartha.get('appUrl'), 'books', doc.ss_book_identifier, '1')
        doc.thumbnail = agartha.path.join(agartha.get('appUrl'),  'images', doc.ss_book_identifier + '.jpg')
        data.content.featured.docs.push(doc)
        if (length === 0) generator.next()
      })
    })
  }
  function start (generator) {
    // init Callbacks
    const content = new Content()
    // start the generator
    generator.next()
    // populate content
    content.body(generator)
  }
  // init "steps" generator
  const generator = steps()
  // run the steps
  start(generator)
}

exports.front = front
