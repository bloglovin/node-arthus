module.exports = function () {
  this.foo = 'bar';
};

module.exports.prototype.init = function (app, fn) {
  this.foo = 'baz';
  fn();
};

