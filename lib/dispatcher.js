//
// # Request Dispatcher
//
// Handles dispatching of request and the helper chain.
//

var domain      = require('domain');
var router      = require('routes');
var routeloader = require('./bootstrap/loadroutes');
var urllib      = require('url');

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
    warn(err.stack);
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

    if (!controller || typeof controller[action] !== 'function') {
      res.writeHead(404);
      res.end(action);
    }
    else {
      controller[action](req, res);
    }
  });
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

