//
// ## Test Application
//

var assert = require('assert');
var app    = require('./../application');

suite('Core Application', function () {
  test ('Setting a controller should work.', function () {
    var a = new app();
    var ret = a.setController('foo', { bar: 'baz' });
    assert(a.getController('foo'));
    assert.equal(a.getController('foo').bar, 'baz');
    assert(ret);
  });

  test('Setting a controller emits event.', function (done) {
    var a = new app();
    a.on('controllerSet', function (controller) {
      assert(controller);
      done();
    });
    var ret = a.setController('foo', { bar: 'baz' });
  });

  test('Don\'t overwrite existing controller.', function () {
    var a = new app();
    a.setController('foo', { bar: 'baz' });
    assert.equal(a.setController('foo', { bar: 'baz' }), false);
  });

  test('Getting a controller should work.', function () {
    var a = new app();
    a.setController('foo', { bar: 'baz' });
    var c = a.getController('foo');
    assert(c);
    assert.equal(c.bar, 'baz');
  });

  test('Getting a nonexistant controller should return false.', function () {
    var a = new app();
    assert.equal(a.getController('foo'), false);
  });

  test('Bootstrapps correctly.', function (done) {
    var a = new app();
    a.bootstrap(__dirname + '/fixture', function (err) {
      assert(a.paths.get('controllers'), 'Paths should be correctly setup.');
      assert(a.config.get('boop'), 'Configuration should be loaded.');
      assert(a.getController('foo'), 'Should correctly load controllers.');
      done();
    });
  });
});

