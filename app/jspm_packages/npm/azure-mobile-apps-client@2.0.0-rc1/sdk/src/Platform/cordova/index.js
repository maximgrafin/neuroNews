/* */ 
var browserExports = require('../web/index');
for (var i in browserExports) {
  exports[i] = browserExports[i];
}
