//
// # Application
//
// Core application object. Manages application state and directs all the
// different parts.
//

var util       = require('util');
var events     = require('events');
var async      = require('async');
var path       = require('path');
var http       = require('http');
var routes     = require('routes');
var dispatcher = require('./lib/dispatcher');
var render     = require('./lib/renderer');

//
// ## Application Constructor
//
// Create a new application object that inherits from *EventEmitter*.
//
// * **logger**, a custom instance of `Winston`. If not specified a default
//   logger will be created.
//
var Application = function (logger) {
  events.EventEmitter.call(this);

  this.controllers = {};
  this.helpers     = {};
  this.paths       = null;
  this.config      = null;
  this.dispatcher  = null;
  this.renderer    = null;
  this.server      = null;
  this.logger      = logger || new (require('winston').Logger)({
    transports: [
      new (require('winston').transports.Console)()
    ]
  });
};

// Extend event emitter.
util.inherits(Application, events.EventEmitter);

//
// ## Shutdown
//
// Shutdown HTTP server and other connections.
//
Application.prototype.shutDown = function () {
  this.server.close();
};

//
// ## Bootstrap
//
// Bootstrap application by loading controllers, and helpers and everything.
//
// * **root**, root directory to bootstrap in.
// * **callback**, called when boostrap is complete or if an error
//   is encountered.
//
Application.prototype.bootstrap = function (root, callback) {
  var log = this.getLogger('info');
  log('[Bootstrap] Bootstrap sequence initiated.');
  this.root = root;
  var self = this;
  async.series(
    [
      // Setup paths
      function loadPaths(fn) {
        var paths = require('./lib/bootstrap/paths');
        log('[Bootstrap] Initializing paths.');
        self.paths = new paths(root, fn);
      },
      // Load configuration
      function loadConf(fn) {
        var config = require('./lib/bootstrap/conf');
        var p = path.join(self.paths.get('config'), 'config.json');
        self.config = config(p);
        log('[Bootstrap] Config loaded.');
        fn();
      },
      // Load controllers
      function loadControllers(fn) {
        var controllerLoader = require('./lib/bootstrap/controllerloader');
        var p = self.paths.get('controllers');
        log('[Bootstrap] Loading controllers:');
        controllerLoader(p, function (n, c) {
          log('\t Did load controller: %s', n);
          self.setController(n, c);
        }, fn);
      },
      // Load helpers
      function loadHelpers(fn) {
        var helperLoader = require('./lib/bootstrap/helperloader');
        var p = self.paths.get('helpers');
        log('[Bootstrap] Loading helpers:');
        helperLoader(p, function (n, c) {
          log('\t Did load helper: %s', n);
          self.setHelper(n, c);
        }, fn);
      },
      // Setup router and load routes
      function setupRoutes(fn) {
        var p = self.paths.get('config');
        var routes = path.join(p, 'routes.json');
        self.dispatcher = new dispatcher(self);
        log('[Bootstrap] Loading routes.');
        self.dispatcher.batchLoad(routes, fn);
      },
      // Initialize controllers, and helpers
      function initializeControllers(fn) {
        var initializers = [];
        log('[Bootstrap] Initializing helpers and controllers:');

        // Make sure the controllers maintain this-context in init.
        function init(obj, app, name) {
          return function (fn) {
            log('\t Initializing %s', name);
            if (obj.init.length === 2) {
              obj.init(app, fn);
            }
            else {
              obj.init(app);
              fn();
            }
          };
        }

        // Get all controllers and helpers with init functions
        for (var controller in self.controllers) {
          if (typeof self.controllers[controller].init === 'function') {
            initializers.push(init(self.controllers[controller], self, controller));
          }
        }
        for (var helper in self.helpers) {
          if (typeof self.helpers[helper].init === 'function') {
            initializers.push(init(self.helpers[helper], self, helper));
          }
        }

        // Execute initialize
        async.parallel(initializers, fn);
      },
      // Preload views
      function preloadViews(fn) {
        var viewspath = self.paths.get('views');
        self.renderer = new render(viewspath);
        log('[Bootstrap] Views loaded.');
        self.renderer.preload(fn);
      },
      // Setup server
      function setupServer(fn) {
        self.server = http.createServer(function (req, res) {
          self.dispatcher.dispatch(req, res);
        });

        var port = self.config.get('http:port') || 3000;
        self.server.listen(port, function () {
          log('[Bootstrap] Server listning on port %d', port);
          fn();
        });
      }
    ],
    function (err) {
      callback(err);
  });
};

//
// ## Set Controller
//
// * **name**, the name of the controller.
// * **controller**, the actual controller.
//
// **Returns** `false` if a controller by that name already exists.
//
Application.prototype.setController = function (name, controller) {
  var ret = false;
  if (!this.controllers[name]) {
    this.controllers[name] = controller;
    ret = true;
    this.emit('controllerSet', [controller]);
  }

  return ret;
};

//
// ## Get Controller
//
// * **name**, the name of the controller.
//
// **Returns** a controller or `false` if controller does not exist.
//
Application.prototype.getController = function (name) {
  var ret = false;
  if (this.controllers[name]) {
    ret = this.controllers[name];
  }

  return ret;
};

//
// ## Set Helper
//
// * **name**, name of the helper.
// * **helper**, the helper.
//
// **Returns** `false` if a helper by that name already exists.
//
Application.prototype.setHelper = function (name, helper) {
  var ret = false;
  if (!this.helpers[name]) {
    this.helpers[name] = helper;
    ret = true;
    this.emit('helperSet', [helper]);
  }

  return ret;
};

//
// ## Get Helper
//
// * **name**, name of the helper.
//
// **Returns** a helper or `false` if a helper does not exist.
//
Application.prototype.getHelper = function (name) {
  var ret = false;
  if (this.helpers[name]) {
    ret = this.helpers[name];
  }

  return ret;
};

//
// ## Get logger
//
// Returns a function that can be used for convenience. It wraps the `logger`
// in a closure so that you can do something like this in your code:
//
//     var log = this.app.getLogger('info');
//     log('Foobar');
//
// All calls to `log` will behave like if you did:
//
//     this.app.logger('info', 'Foobar');
//
// * **type**, the type of logger you want; `info`, `error` etc.
//
// **Returns** a function for logging.
//
Application.prototype.getLogger = function (type) {
  var self = this;
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(type);
    self.logger.log.apply(self.logger, args);
  };
};

module.exports = Application;

