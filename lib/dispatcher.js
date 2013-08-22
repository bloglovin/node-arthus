//
// # Request Dispatcher
//
// Handles dispatching of request and the helper chain.
//

var domain      = require('domain');
var router      = require('routes');
var routeloader = require('./bootstrap/loadroutes');
var urllib      = require('url');
var async       = require('async');
var cookie      = require('cookie');

//
// ## Constructor
//
// Creates a new dispatcher with a router for every relevant request method.
// The methods that are left out are handled separately or as GET requests.
//
// * **app**, the main app object.
//
var Dispatcher = function (app) {
  this.app     = app;
  this.routers = {};
  this.HTTPMethods = ['get', 'post', 'put', 'delete', 'patch'];

  for (var i in this.HTTPMethods) {
    this.routers[this.HTTPMethods[i]] = router();
  }

  this.preRequest = {};
};

//
// ## Batch load
//
// Setup a set of routes.
//
// * **routes**, object containing routes.
//
Dispatcher.prototype.batchLoad = function (routes, callback) {
  routeloader(routes, this.routers, callback);
};


//
// ## Set Route
//
// Binds a route to a controller and action.
//
// * **method**, HTTP method this is route is for.
// * **route**, the path to bind.
// * **controller**, a string in the form of `controller.action`.
//
Dispatcher.prototype.setRoute = function (method, route, controller) {
  this.routers[method].addRoute(route, controller);
};

//
// ## Add pre-request helper
//
// Adds a function that will be run before a request is dispatched.
//
// Uses async.auto to dispatch requests.
//
// @see https://github.com/caolan/async#auto
//
// * **name**, the name of the pre-request handler. Can be used by other
//   handlers to create dependency graphs.
// * **fn**, function to run. The function will recieve the `req` and `res`
//   objects as well a callback function that needs to be called when done.
//   Can also be an array where the values are names of handlers that need to
//   run before the one being added. The last element of the array should
//   always be a function.
//
Dispatcher.prototype.addPreRequestHelper = function (name, fn) {
  this.preRequest[name] = fn;
};

//
// ## Dispatch
//
// Handles a request.
//
Dispatcher.prototype.dispatch = function (req, res) {
  var start = Date.now();
  var self  = this;
  var info  = this.app.getLogger('info');
  var warn  = this.app.getLogger('error');

  var requestDomain = domain.create();
  requestDomain.add(req);
  requestDomain.add(res);

  req.viewData = {};
  res.viewData = {};

  req.on('finish', function () {
    info('[%dms] %s', Date.now() - start, req.url);
  });

  // Handle request error
  requestDomain.on('error', function (err) {
    try {
      //warn('Error encoutered: %s\n%s', err, err.stack);
      var errData = {
        code: err.code || 500,
        msg: err.message,
        stack: err.stack
      };

      if (!res.headersSent) {
        res.statusCode = errData.code;
      }

      if (req.isAJAX) {
        res.end(JSON.stringify(errData));
      }
      else {
        // Error templates can be placed in a folder called errors and
        // named after the error code it wants to "be for".
        var views = self.app.renderer.views;
        var View  = self.app.renderer.View;
        var templateSuggestions = [
          errData.code + '',
          'error'
        ];

        var finalTemplate = false;
        for (var template in templateSuggestions) {
          var t = templateSuggestions[template];
          if (typeof views['error/' + t] === 'function') {
            finalTemplate = new View('error/' + t, errData);
            break;
          }
        }

        // Force JSON output if we don't have a template.
        if (!finalTemplate) {
          req.end(JSON.stringify(errData));
        }
        else {
          self.app.renderer.render(req, res, finalTemplate);
        }
      }
    }
    catch (er) {
      res.end('Fatal error');
      console.log(er.stack);
    }
  });

  // Handle request
  requestDomain.run(function () {
    var method = req.method.toLowerCase();
    var url    = urllib.parse(req.url);
    var target = self.routers[method].match(url.pathname) || false;
    var parts  = target ? target.fn.split('.') : false;
    var controller = parts ? self.app.getController(parts[0]) : false;
    var action = parts ? parts[1] : false;

    if (req.headers && req.headers.cookie) {
      req.cookies = cookie.parse(req.headers.cookie);
    }
    else {
      req.cookies = {};
    }

    req.isAJAX = self.requestIsAJAX(req);

    self.dispatchPreRequest(req, res, function (err) {
      //if (err) throw err;

      // Check for 404
      if (typeof target.fn !== 'string') {
        var e404 = new Error('Not Found');
        e404.code = 404;
        console.log('going 404');
        throw e404;
      }
      else {
        var hasCallback = controller[action].length === 4;
        if (hasCallback) {
          controller[action](req, res, target, function (err, views) {
            self.app.renderer.render(req, res, views);
          });
        }
        else {
          var views = controller[action](req, res, target);
          if (views) {
            self.app.renderer.render(req, res, views);
          }
        }
      }
    });
  });
};

//
// ## Dispatch Pre-request
//
// * **req**
// * **res**
// * **callback**, called when done.
//
Dispatcher.prototype.dispatchPreRequest = function (req, res, callback) {
  var functions = {};

  function dispatch(func, req, res) {
    return function (fn, result) {
      func(req, res, fn);
    };
  }

  for (var name in this.preRequest) {
    var fn = this.preRequest[name];
    if (Array.isArray(fn)) {
      fn = fn.slice(0);
      var handler = fn.pop();
      var newHandler = dispatch(handler, req, res);
      fn.push(newHandler);
    }
    else if (typeof fn === 'function') {
      fn = dispatch(fn, req, res);
    }

    functions[name] = fn;
  }

  async.auto(functions, callback);
};

//
// ## Determine AJAX
//
// Determines if a request is done with AJAX or not.
//
// * **req**, request object.
//
// **Returns** true if request is made with AJAX.
//
Dispatcher.prototype.requestIsAJAX = function (req) {
  var header = 'x-requested-with';
  var url = urllib.parse(req.url, true);
  var query = url.query;
  return (req.headers[header] && req.headers[header] === 'XMLHttpRequest') ||
    (query.json && query.json === 'true');
};

module.exports = Dispatcher;

