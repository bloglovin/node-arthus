//
// # Test Dispatcher
//

var assert     = require('assert');
var dispatcher = require('./../lib/dispatcher');

suite('Dispatcher', function () {
  test('Routers for each http method should exist.', function () {
    var d = new dispatcher({});
    d.HTTPMethods.forEach(function (method) {
      assert(d.routers[method]);
    });
  });

  test('Batch loading a set of routes should work.', function (done) {
    var d = new dispatcher({});
    d.batchLoad({
      get: {
        '/foo': 'foo.foo'
      },
      post: {
        '/bar': 'bar.bar'
      }
    }, function () {
      var match = d.routers.get.match('/foo');
      assert.equal(match.fn, 'foo.foo');
      match = d.routers.post.match('/bar');
      assert.equal(match.fn, 'bar.bar');
      done();
    });
  });

  test('Setting a route should work.', function () {
    var d = new dispatcher();
    d.setRoute('get', '/index', 'foo.bar');
    var match = d.routers.get.match('/index');
    assert.equal(match.fn, 'foo.bar');
  });

  test('Setting a pre request helper should work.', function (done) {
    var d = new dispatcher();
    d.addPreRequestHelper(function () {
      done();
    });

    d.preRequest[0]();
  });

  test('Correctly identifies AJAX requests.', function () {
    var req = {
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      }
    };

    var d = new dispatcher({});
    assert(d.requestIsAJAX(req));
  });
});

