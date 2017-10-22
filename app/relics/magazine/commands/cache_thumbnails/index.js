'use strict'
const CacheThumbnails = class {
  get command () {
    return 'cache_thumbnails'
  }
  get alias () {
    return 'cts'
  }
  get description () {
    return 'Cache thumbnails'
  }
  get options () {
    return []
    /**  @TODO: advanced implementation
    return [
      {
        'flag': '--cts-iiif',
        'description': 'IIIF image server compatible'
      },
      {
        'flag': '--cts-width',
        'description': 'Width'
      },
      {
        'flag': '--cts-height',
        'description': 'Height'
      },
      {
        'flag': '--cts-rotation',
        'description': 'The degrees of clockwise rotation from 0 up to 360.'
      },
      {
        'flag': '--cts-level',
        'description': 'Image rotation'
      }
    ]
    */
  }
  action () {
    const agartha = process.agartha
    const collectionCode = agartha.get('collectionCode')
    const discovery = agartha.get('datasource').discovery.url + '?wt=json&fq=sm_collection_code:' + collectionCode + '&fl=ss_representative_image,ss_book_identifier&rows=100&sort=iass_timestamp%20desc'
    agartha.request({ method: 'GET', uri: discovery, timeout: 1500 }, (error, response, body) => {
      if (error) return
      // https://nodejs.org/api/fs.html
      const fs = require('fs')
      // https://nodejs.org/api/url.html
      const { URL, URLSearchParams } = require('url')
      const source = JSON.parse(body)
      let length = source.response.docs.length
      agartha._.each(source.response.docs, (doc) => {
        let source = new URL(doc.ss_representative_image)
        let params = new URLSearchParams(source.search)
            params.delete('svc.scale')
            params.append('svc.level', 1)
        agartha.request.get(source.protocol + '//' + source.hostname + source.pathname + '?' + params.toString())
          .on('response', () => {
            if (--length === 0) {
              agartha.log('Finished cachig thumbnails.', 'ok')
            }
          })
          .on('error', (err) => {
            console.log(err)
          })
          .pipe(fs.createWriteStream(agartha.path.join(agartha.appDir(), 'app', 'images', doc.ss_book_identifier + '.jpg')))
      })
    })
    .on('error', (err) => {
      if (err.code === 'ETIMEDOUT') {
        agartha.log('Timeout', 'Error')
      }
      else {
        console.log(err)
      }
    })
  }
}

module.exports = exports = CacheThumbnails
