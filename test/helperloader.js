//
// # Test Helper Loader
//

var assert = require('assert');
var loader = require('./../lib/bootstrap/helperloader');

suite('Helper Loader', function () {
  test('Correctly loads helpers', function (done) {
    var helpers = {};
    function fn(name, helper) {
      helpers[name] = helper;
    }

    function callback () {
      assert(helpers.bar);
      done();
    }
    loader(__dirname + '/fixture/helpers', fn, callback);
  });
});

