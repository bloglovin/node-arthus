//
// # Helper Loader
//
// Loads helpers from the target directory.
//
// * **dir**, directory to load from.
// * **fn**, function called with each helper.
// * **callback**, called when done or on error.
//
var fs   = require('fs');
var path = require('path');
var HelperLoader = function (dir, fn, callback) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      callback(err);
      return;
    }

    for (var i = 0, len = files.length; i < len; i++) {
      if (files[i].indexOf('.js') === -1) continue;
      var name = path.basename(files[i], '.js');
      var source = path.join(dir, name);
      var helper = require(source);

      // Helpers that take arguments are not helpers that are supposed to be
      // instaniated. Instead they are small helper functions. Those are just
      // added as is to the helper list.
      if (typeof helper !== 'function' || helper.length > 0) {
        fn(name, helper);
      }
      else {
        fn(name, new helper());
      }
    }

    callback();
  });
};

module.exports = HelperLoader;

