/* */ 
var Validate = require('../Utilities/Validate'),
    Query = require('azure-query-js').Query,
    _ = require('../Utilities/Extensions'),
    tableHelper = require('../tableHelper'),
    Platform = require('../Platform/index');
function MobileServiceSyncTable(tableName, client) {
  Validate.isString(tableName, 'tableName');
  Validate.notNullOrEmpty(tableName, 'tableName');
  Validate.notNull(client, 'client');
  this.getTableName = function() {
    return tableName;
  };
  this.getMobileServiceClient = function() {
    return client;
  };
  this.insert = function(instance) {
    return client.getSyncContext().insert(tableName, instance);
  };
  this.update = function(instance) {
    return client.getSyncContext().update(tableName, instance);
  };
  this.lookup = function(id, suppressRecordNotFoundError) {
    return client.getSyncContext().lookup(tableName, id, suppressRecordNotFoundError);
  };
  this.read = function(query) {
    if (_.isNull(query)) {
      query = new Query(tableName);
    }
    return client.getSyncContext().read(query);
  };
  this.del = function(instance) {
    return client.getSyncContext().del(tableName, instance);
  };
  this.pull = function(query, queryId, settings) {
    if (!query) {
      query = new Query(tableName);
    }
    return client.getSyncContext().pull(query, queryId, settings);
  };
  this.purge = function(query, forcePurge) {
    if (!query) {
      query = new Query(tableName);
    }
    return client.getSyncContext().purge(query, forcePurge);
  };
}
tableHelper.defineQueryOperators(MobileServiceSyncTable);
exports.MobileServiceSyncTable = MobileServiceSyncTable;
