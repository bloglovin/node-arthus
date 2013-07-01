//
// # Request Dispatcher
//
// Handles dispatching of request and the helper chain.
//

var domain      = require('domain');
var router      = require('routes');
var routeloader = require('./bootstrap/loadroutes');


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

Dispatcher.prototype.dispatch = function (req, res) {

};

module.exports = Dispatcher;

