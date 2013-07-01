//
// # Paths
//
// Application path helper. Makes sure vital paths exists and provides a
// helper function for getting at those paths.
//
// * **root**, root directory.
// * **callback**, called when done.
//
var fs = require('fs');
var path = require('path');
var Paths = function (root, callback) {
  this.paths = {};
  var self = this;
  var expected = ['controllers', 'views', 'models', 'helpers', 'config', 'assets'];
  function check(dir, cb) {
    if (typeof dir !== 'string') {
      cb();
      return;
    }

    var target = path.join(root, dir);
    fs.stat(target, function (err, stat) {
      if (err) {
        cb(err);
        return;
      }
      else {
        self.paths[dir] = target;
        var next = expected.shift();
        check(next, cb);
      }
    });
  }

  check(expected.shift(), callback);
};

//
// ## Get path
//
// Get path for specified directory.
//
// * **name**, name of directory.
//
// **Returns** path or false.
//
Paths.prototype.get = function (name) {
  return this.paths[name] || false;
};

module.exports = Paths;

