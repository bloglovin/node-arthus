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
var Application = function () {
  events.EventEmitter.call(this);

  this.controllers = {};
  this.helpers     = {};
  this.paths       = null;
  this.config      = null;
  this.dispatcher  = null;
  this.renderer    = null;
  this.server      = null;
};

// Extend event emitter.
util.inherits(Application, events.EventEmitter);

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
  this.root = root;
  var self = this;
  async.series(
    [
      // Setup paths
      function loadPaths(fn) {
        var paths = require('./lib/bootstrap/paths');
        self.paths = new paths(root, fn);
      },
      // Load configuration
      function loadConf(fn) {
        var config = require('./lib/bootstrap/conf');
        var p = path.join(self.paths.get('config'), 'config.json');
        self.config = config(p);
        fn();
      },
      // Load controllers
      function loadControllers(fn) {
        var controllerLoader = require('./lib/bootstrap/controllerloader');
        var p = self.paths.get('controllers');
        controllerLoader(p, function (n, c) {
          self.setController(n, c);
        }, fn);
      },
      // Load helpers
      function loadHelpers(fn) {
        var helperLoader = require('./lib/bootstrap/helperloader');
        var p = self.paths.get('helpers');
        helperLoader(p, function (n, c) {
          self.setHelper(n, c);
        }, fn);
      },
      // Setup router and load routes
      function setupRoutes(fn) {
        var p = self.paths.get('config');
        var routes = path.join(p, 'routes.json');
        self.dispatcher = new dispatcher(self);
        self.dispatcher.batchLoad(routes, fn);
      },
      // Initialize controllers, and helpers
      function initializeControllers(fn) {
        var initializers = [];

        // Make sure the controllers maintain this-context in init.
        function init(obj, app) {
          return function (fn) {
            obj.init(app, fn);
          };
        }

        // Get all controllers and helpers with init functions
        for (var controller in self.controllers) {
          if (typeof self.controllers[controller].init === 'function') {
            initializers.push(init(self.controllers[controller], self));
          }
        }
        for (var helper in self.helpers) {
          if (typeof self.helpers[helper].init === 'function') {
            initializers.push(init(self.helpers[helper], self));
          }
        }

        // Execute initialize
        async.parallel(initializers, fn);
      },
      // Preload views
      function preloadViews(fn) {
        var viewspath = self.paths.get('views');
        self.renderer = new render(viewspath);
        self.renderer.preload(fn);
      },
      // Setup server
      function setupServer(fn) {
        self.server = http.createServer(function (req, res) {
          self.dispatcher.dispatch(req, res);
        });

        var port = self.config.get('http:port') || 3000;
        self.server.listen(port, fn);
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

module.exports = Application;

