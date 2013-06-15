//
// ## Controller Loader
//
// Loads controllers from the target directory.
//
// * **dir**, directory to load controllers from.
// * **fn**, function called with each controller.
// * **callback**, called when done.
//
var fs = require('fs');
var path = require('path');
var ControllerLoader = function (dir, fn, callback) {
  fs.readdir(dir, function (err, files) {
    for (var i = 0, len = files.length; i < len; i++) {
      if (files[i].indexOf('.js') === -1) continue;
      var name = path.basename(files[i], '.js');
      var source = path.join(dir, name);
      var c = new require(source)();
      fn(name, source);
    }

    callback();
  });
};

module.exports = ControllerLoader;

