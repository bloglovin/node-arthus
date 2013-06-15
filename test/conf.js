//
// # Test Configuration
//

var assert = require('assert');
var config = require('./../lib/bootstrap/conf');

suite('Configuration Loader', function () {
  test('Correctly loads configuration.', function () {
    var c = config(__dirname + '/fixture/config/config.json');
    assert(c.get);
    assert(c.get('boop'));
  });
});

