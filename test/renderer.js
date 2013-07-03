//
// # Test Renderer
//

var assert   = require('assert');
var renderer = require('./../lib/renderer');
var view     = require('./../lib/view');

var req  = { isAJAX: false };
var jreq = { isAJAX: true };

var stream = require('stream');
var res = function () {
  stream.Writable.call(this);
  this.buf = '';
};
res.prototype = Object.create(stream.Writable.prototype, {
  constructor: { value: res }
});
res.prototype._write = function (chunk, encoding, callback) {
  this.buf += chunk;
  callback();
};
res.prototype.setHeader = function () {};


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

  test('Renders single view object.', function (done) {
    var r = new renderer(__dirname + '/fixture/views');
    r.preload(function (err) {
      var v = new view('test', { bar: 'foo' });
      var re = new res();
      re.on('finish', function () {
        assert.equal(re.buf, '<span>foo</span>');
        done();
      });
      r.render(req, re, v);
    });
  });

  test('Renders single view object as JSON.', function (done) {
    var r = new renderer(__dirname + '/fixture/views');
    r.preload(function (err) {
      var data = { bar: 'foo' };
      var v = new view('test', data);
      var re = new res();
      re.on('finish', function () {
        assert.equal(re.buf, JSON.stringify({ 'test': data }));
        done();
      });
      r.render(jreq, re, v);
    });
  });

  test('Renders array of view objects.', function (done) {
    var r = new renderer(__dirname + '/fixture/views');
    r.preload(function (err) {
      var views = [];
      views.push(new view('test', { bar: 1 }));
      views.push(new view('test', { bar: 2 }));

      var re = new res();
      re.on('finish', function () {
        assert.equal(re.buf, '<span>1</span><span>2</span>');
        done();
      });
      r.render(req, re, views);
    });
  });

  test('Renders array of view objects as JSON.', function (done) {
    var r = new renderer(__dirname + '/fixture/views');
    r.preload(function (err) {
      var views = [];
      views.push(new view('foo/bar', { bar: 1 }));
      views.push(new view('test', { bar: 2 }));

      var re = new res();
      re.on('finish', function () {
        assert.equal(re.buf, JSON.stringify({
          'foo/bar': { bar: 1 },
          test: { bar: 2 }
        }));
        done();
      });
      r.render(jreq, re, views);
    });
  });
});

