//
// # Application
//

var util   = require('util');
var events = require('events');
var async  = require('async');
var path   = require('path');

//
// ## Application Constructor
//
var Application = function () {
  events.EventEmitter.call(this);

  this.controllers = {};
  this.helpers     = {};
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
      // Initialize controllers
      function initializeControllers(fn) {
        fn();
      },
      // Setup router and load routes
      function setupRoutes(fn) {
        fn();
      },
      // Preload views
      function preloadViews(fn) {
        fn();
      },
      // Setup server
      function setupServer(fn) {
        fn();
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

