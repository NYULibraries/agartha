function books (data) {
  'use strict'
  let agartha = process.agartha
  data.content.viewer = agartha.get('datasource').viewer.url
  agartha.emit('task.done', data)
}

exports.books = books
