/* */ 
var Validate = require('../Utilities/Validate'),
    Query = require('azure-query-js').Query,
    Platform = require('../Platform/index'),
    taskRunner = require('../Utilities/taskRunner'),
    MobileServiceTable = require('../MobileServiceTable'),
    tableConstants = require('../constants').table,
    _ = require('../Utilities/Extensions');
function createPurgeManager(store, storeTaskRunner) {
  return {purge: purge};
  function purge(query, forcePurge) {
    return storeTaskRunner.run(function() {
      Validate.isObject(query, 'query');
      Validate.notNull(query, 'query');
      if (!_.isNull(forcePurge)) {
        Validate.isBool(forcePurge, 'forcePurge');
      }
      var operationQuery = new Query(tableConstants.operationTableName).where(function(tableName) {
        return this.tableName === tableName;
      }, query.getComponents().table);
      var incrementalSyncStateQuery = new Query(tableConstants.pulltimeTableName).where(function(tableName) {
        return this.tableName === tableName;
      }, query.getComponents().table);
      return Platform.async(function(callback) {
        callback();
      })().then(function() {
        if (forcePurge) {
          return store.del(operationQuery);
        } else {
          return store.read(operationQuery).then(function(operations) {
            if (operations.length > 0) {
              throw new Error('Cannot purge the table as it contains pending operations');
            }
          });
        }
      }).then(function() {
        return store.del(incrementalSyncStateQuery);
      }).then(function() {
        return store.del(query);
      });
    });
  }
}
exports.createPurgeManager = createPurgeManager;
