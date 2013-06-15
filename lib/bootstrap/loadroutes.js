//
// # Load Routes
//
// * **routes**, path to json file containting the routes.
// * **routers**, an object containing routers, keyed by method.
// * **callback**, called when done or on error.
//
module.exports = function (routes, routers, callback) {
  var r = require(routes);
  for (var method in r) {
    var router = routers[method];
    if (!router) {
      callback(new Error('Invalid HTTP method / missing router.'));
      return;
    }

    var methodRoutes = r[method];
    for (var path in methodRoutes) {
      router.addRoute(path, methodRoutes[path]);
    }
  }

  callback();
};

