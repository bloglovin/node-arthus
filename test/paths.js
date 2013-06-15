//
// # Test Paths
//

var assert = require('assert');
var paths  = require('./../lib/bootstrap/paths');

suite('Paths', function () {
  test('Correctly setup paths.', function (done) {
    var p = __dirname + '/fixture';
    var foo = new paths(p, function (err) {
      assert(!err);
      done();
    });
  });

  test('Getting a path returns a string.', function (done) {
    var p = __dirname + '/fixture';
    var foo = new paths(p, function (err) {
      check();
    });

    function check() {
      assert(foo.get('views'));
      assert(!foo.get('bar'));
      done();
    }
  });
});

