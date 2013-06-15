//
// # Configuration Loading
//
// Uses [nconf](https://npmjs.org/package/nconf) to load configurations.
//
var nconf = require('nconf');

var conf = null;
module.exports = function (path) {
  return nconf.env().file(path);
};

