//
// # Renderer
//
// Manages views and rendering of those.
//
// @TODO: Add debug option.
//

var filemap = require('filemap');
var glob    = require('glob');
var jade    = require('jade');

var Renderer = function (dir) {
  this.root = dir;
  this.views = {};
  this.debug = false;
};

//
// ## Preload Views
//
// Preload all views in the views directory and compile them.
//
// * **callback**, called when done.
//
Renderer.prototype.preload = function (callback) {
  var self = this;
  glob(this.root + '/**/*.jade', function (err, files) {
    filemap(files, function (files) {
      for (var view in files) {
        var start = self.root.length + 1;
        var name = view.substr(start).replace('.jade', '');
        self.views[name] = self.compile(view, files[view]);
      }

      callback(err);
    });
  });
};

//
// ## Compile Template
//
// Compile a template.
//
// * **file**, full path name of the view.
// * **contents**, the contents of the file.
//
Renderer.prototype.compile = function (file, contents) {
  return jade.compile(contents, {
    filename: file,
    compileDebug: this.debug,
    pretty: this.debug
  });
};

module.exports = Renderer;

