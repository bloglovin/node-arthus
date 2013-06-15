module.exports = function () {
  this.bar = 'foo';
};

module.exports.prototype.init = function (app, fn) {
  this.bar = 'foobar';
  fn();
};

