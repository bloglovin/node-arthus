//
// # Controller Loader
//

var assert = require('assert');
var cl     = require('./../lib/bootstrap/controllerloader');

suite('Controller Loader', function () {
  test('Correctly loads controllers..', function (done) {
    var controllers = {};
    function fn(name, controller) {
      controllers[name] = controller;
    }

    function callback () {
      assert(controllers.foo);
      done();
    }
    cl(__dirname + '/fixture/controllers', fn, callback);
  });
});

