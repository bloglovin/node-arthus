//
// # Renderer
//
// Manages views and rendering of those.
//
// @TODO: Add debug option.
// @TODO: Factor out to it's own module.
//

var filemap    = require('filemap');
var glob       = require('glob');
var jade       = require('jade');
var jsonstream = require('JSONStream');
var _          = require('lodash');
var View       = require('./view');

var Renderer = function (dir) {
  this.root  = dir;
  this.views = {};
  this.debug = false;
  this.defaultHeader = null;
  this.defaultFooter = null;
  this.View  = View;

  // Object containing extra options passed to views.
  this.vopts = {};

  // A bit of a hackish, but simple way, to make nested views work without
  // tons of code.
  var self = this;
  View.prototype.toString = function () {
    return self.views[this.name](this.data);
  };
  View.prototype.toJSON = function () {
    return this.data;
  };
};

//
// ## Add view option
//
// Adds a single item to the extra view options.
//
// * **name**, the name of the item, as it will be used in the views.
// * **data**, the value of the item, a function, a string, what ever.
//
Renderer.prototype.addViewOption = function (name, item) {
  this.vopts[name] = item;
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
  req.profiler.start('render');
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

  var self = this;
  if (!req.isAJAX) {
    views.forEach(function (view) {
      self.iterateHierarchy(view, req, res, self.vopts);
    });
  }

  var fn = req.isAJAX ? 'sendJSON' : 'sendHTML';
  this[fn].apply(this, [req, res, views]);
};

//
// ## Modify views
//
// Recursively iterates the view hierarchy and add request/response specific
// data to them.
//
// Will look for a viewData property on req and res, and add those to every
// view's data.
//
// * **view**, the base view to start on.
// * **req**, request object.
// * **res**, response object.
// * **data**, additional data provided by the renderer.
//
Renderer.prototype.iterateHierarchy = function (view, req, res, data) {
  var reqData = req.viewData || {};
  var resData = res.viewData || {};
  data        = data || {};

  _.merge(view.data, reqData, resData, data);

  for (var prop in view.data) {
    var potentialView = view.data[prop];
    if (potentialView.type && potentialView.type === 'view') {
      this.iterateHierarchy(view.data[prop], req, res, data);
    }
  }
};

//
// ## Send HTML Response
//
Renderer.prototype.sendHTML = function (req, res, views) {
  // Before we start to send stuff, set headers.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Now serially render the results. No async needed since rendering is
  // all sync.
  var self = this;
  views.forEach(function (view) {
    var name = view.name;
    var vars = view.data;
    res.write(self.views[name](vars));
  });

  req.profiler.stop('render');
  res.end();
};

//
// ## Send JSON Response
//
Renderer.prototype.sendJSON = function (req, res, views) {
  // Before we start to send stuff, set headers.
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  var stream = jsonstream.stringifyObject('{', ',', '}');
  stream.pipe(res);

  function stripNonAJAX(view) {
    for (var prop in view.data) {
      if (view.data[prop].includeAJAX === false) {
        delete(view.data[prop]);
        continue;
      }

      var potentialView = view.data[prop];
      if (potentialView.type && potentialView.type === 'view') {
        stripNonAJAX(view.data[prop]);
      }
    }
  }

  views.forEach(stripNonAJAX);

  // Emit each view as it's own key in the response object.
  views.forEach(function (view, i, arr) {
    if (!view.includeAJAX) return;
    stream.write([view.name, view.data]);
  });

  // End JSON response.
  req.profiler.stop('render');
  stream.end();
};

module.exports = Renderer;

