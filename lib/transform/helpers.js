module.exports = () => {
  function json(context, options) {
    return options.fn(JSON.parse(context));
  }
  function speakingurl(context, options) {
    var getSlug = require('speakingurl');
    return getSlug(this.label);
  }
  return {
    json : json,
    speakingurl : speakingurl
  };
}
