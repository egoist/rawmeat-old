
/**
 * Module dependencies.
 */

var views = require('co-views');

// setup views mapping .html
// to the swig template engine

module.exports = views(__dirname + '/../themes/sword', {
  map: { html: 'swig' },
  cache: 'memory'
});