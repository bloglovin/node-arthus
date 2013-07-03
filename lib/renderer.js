//
// # Renderer
//
// Manages views and rendering of those.
//
// @TODO: Add debug option.
// @TODO: Factor out to it's own module.
//

var filemap = require('filemap');
var glob    = require('glob');
var jade    = require('jade');
var View    = require('./view');

var Renderer = function (dir) {
  this.root  = dir;
  this.views = {};
  this.debug = false;
  this.defaultHeader = null;
  this.defaultFooter = null;
  this.View  = View;
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

//
// ## Render
//
// Takes a render object and turns it into HTML.
//
// * **req**, the request stream object.
// * **res**, the response stream object.
// * **struct**, render structure.
//
Renderer.prototype.render = function (req, res, struct) {
  var views = [];

  // Struct is an array, wrap in header/footer if not AJAX
  if (Array.isArray(struct)) {
    views = struct;
    if (this.defaultHeader) {
      views.shift(new View(this.defaultHeader, false));
    }
    if (this.defaultFooter) {
      views.push(new View(this.defaultFooter, false));
    }
  }

  // If struct has the main property it's a plain object with possible
  // header/footer modifications
  else if (typeof struct === 'object' && struct.main) {
    if (typeof struct.header === 'object') {
      var header = struct.header;
      if (header.type && header.type === 'view') {
        views.push(header);
      }
      else {
        views.push(new View(this.defaultHeader, header));
      }
    }

    if (Array.isArray(struct.main)) {
      views = views.concat(struct.main);
    }
    else if (struct.main.type && struct.main.type === 'view') {
      views.push(struct.main);
    }

    if (typeof struct.footer === 'object') {
      var footer = struct.footer;
      if (footer.type && footer.type === 'view') {
        views.push(footer);
      }
      else {
        views.push(new View(this.defaultFooter, footer));
      }
    }
  }

  // Single View object
  else if (typeof struct === 'object' && struct.type && struct.type === 'view') {
    if (this.defaultHeader) {
      views.shift(new View(this.defaultHeader, false));
    }

    views.push(struct);

    if (this.defaultFooter) {
      views.push(new View(this.defaultFooter, false));
    }
  }

  var fn = req.isAJAX ? 'sendJSON' : 'sendHTML';
  this[fn].apply(this, [req, res, views]);
};

//
// ## Send HTML Response
//
Renderer.prototype.sendHTML = function (req, res, views) {
  // Before we start to send stuff, set headers.
  res.setHeader('Content-Type', 'text/html');

  // Now serially render the results. No async needed since rendering is
  // all sync.
  var self = this;
  views.forEach(function (view) {

    var name = view.name;
    var vars = view.data;
    res.write(self.views[name](vars));
  });

  res.end();
};

//
// ## Send JSON Response
//
Renderer.prototype.sendJSON = function (req, res, views) {
  // Begin JSON response.
  res.write('{');

  // Emit each view as it's own key in the response object.
  views.forEach(function (view, i, arr) {
    if (!view.includeAJAX) return;

    res.write('"' + view.name + '":' + JSON.stringify(view.data));
    if (i < arr.length - 1) {
      res.write(',');
    }
  });

  // End JSON response.
  res.write('}');
  res.end();
};

module.exports = Renderer;

