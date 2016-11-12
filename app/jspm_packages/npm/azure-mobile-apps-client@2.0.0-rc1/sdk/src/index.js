/* */ 
var _ = require('./Utilities/Extensions');
var api = {
  MobileServiceClient: require('./MobileServiceClient'),
  MobileServiceLogin: require('./MobileServiceLogin'),
  MobileServiceSyncTable: require('./sync/MobileServiceSyncTable'),
  MobileServiceTable: require('./MobileServiceTable'),
  Query: require('azure-query-js').Query
};
var targetExports = require('./Platform/sdkExports');
for (var i in targetExports) {
  if (_.isNull(api[i])) {
    api[i] = targetExports[i];
  } else {
    throw new Error('Cannot export definition ' + i + ' outside the SDK. Multiple definitions with the same name exist');
  }
}
module.exports = api;
