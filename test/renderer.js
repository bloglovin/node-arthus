//
// # Test Renderer
//

var assert   = require('assert');
var renderer = require('./../lib/renderer');

suite('Renderer', function () {
  test('Loads views properly.', function (done) {
    var r = new renderer(__dirname + '/fixture/views');
    r.preload(function (err) {
      assert(!err);
      assert(typeof r.views.index === 'function');
      assert(typeof r.views['foo/bar'] === 'function');
      done();
    });
  });
});

