/* */ 
var target = require('./environment').getTarget();
if (target === 'Cordova') {
  module.exports = require('./cordova/index');
} else if (target === 'Web') {
  module.exports = require('./web/index');
} else {
  throw new Error('Unsupported target');
}
