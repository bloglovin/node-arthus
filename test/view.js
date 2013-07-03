//
// # Test View
//

var assert = require('assert');
var view   = require('./../lib/view');

suite('Views', function () {
  test('Default include AJAX with no explicit argument.', function () {
    var v = new view('foo', { bar: 'baz' });
    assert(v.includeAJAX);
    assert(v.data.bar);
  });

  test('Do not include AJAX when explicit.', function () {
    var v = new view('foo', false, { bar: 'baz' });
    assert(!v.includeAJAX);
    assert(v.data.bar);
  });

  test('Has correct type.', function () {
    var v = new view('foo', false, { bar: 'baz' });
    assert.equal(v.type, 'view');
  });
});

