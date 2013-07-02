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

  this.preRequest = [];
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
// * **fn**, function to run. The function will recieve the `req` and `res`
//   objects as well a callback function that needs to be called when done.
//
Dispatcher.prototype.addPreRequestHelper = function (fn) {
  this.preRequest.push(fn);
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

  req.on('finish', function () {
    info('[%dms] %s', Date.now() - start, req.url);
  });

  requestDomain.on('error', function (err) {
    warn('Error encoutered: %s\n%s', err, err.stack);
    res.end(err.stack);
  });

  requestDomain.run(function () {
    var method = req.method.toLowerCase();
    var url    = urllib.parse(req.url);
    var target = self.routers[method].match(url.pathname);
    var parts  = target.fn.split('.');
    var controller = self.app.getController(parts[0]);
    var action = parts[1];

    req.isAJAX = self.requestIsAJAX(req);

    self.dispatchPreRequest(req, res, function (err) {
      // @TODO: Fix real error handling.
      if (err) throw err;

      if (!controller || typeof controller[action] !== 'function') {
        res.writeHead(404);
        res.end(action);
      }
      else {
        controller[action](req, res, target);
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
  var functions = [];
  function dispatch(func, req, res) {
    return function (fn) {
      func(req, res, fn);
    };
  }

  this.preRequest.forEach(function (fn) {
    functions.push(dispatch(fn, req, res));
  });

  async.series(functions, callback);
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
  return (req.headers[header] && req.headers[header] === 'XMLHttpRequest');
};

/*
      // Start session and dispatch router class.
      self._session(req, res, function (err) {
        if (err) throw err;
        self._controllers[controller][action](req, res, target);
      });
    });

    */
module.exports = Dispatcher;

