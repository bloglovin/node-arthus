//
// # Profiler
//
// Adds profiling to requests.
//
var _  = require('lodash');
var fs = require('fs');

var Profiler = module.exports = function (url, conf) {
  this.url  = url;
  this.conf = conf;
  this.data = {};
};

Profiler.prototype.start = function (label, data) {
  this.data[label] = {
    label: label,
    data: data || {},
    start: Date.now()
  };
};

Profiler.prototype.stop = function (label, data) {
  data = data || {};
  this.data[label].stop = Date.now();
  this.data[label].total = this.data[label].stop - this.data[label].start;
  this.data[label].data = _.merge(this.data[label].data, data);
};

Profiler.prototype.complete = function () {
  if (!this.conf) return;
  var conf = this.conf;

  if (conf.redis) {

  }
  if (conf.file) {
    var data = {
      url: this.url,
      data: this.data,
    };
    fs.appendFileSync(conf.file, JSON.stringify(data) + '\n');
  }
};

Profiler.prototype.decorateCallback = function (label, fn) {
  var self = this;
  return function () {
    fn.apply(fn, arguments);
    self.stop(label);
  };
};

