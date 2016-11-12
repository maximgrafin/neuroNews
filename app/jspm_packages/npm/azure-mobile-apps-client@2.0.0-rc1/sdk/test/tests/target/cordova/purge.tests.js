/* */ 
var Platform = require('../../../../src/Platform/index'),
    Query = require('azure-query-js').Query,
    createPurgeManager = require('../../../../src/sync/purge').createPurgeManager,
    tableConstants = require('../../../../src/constants').table,
    MobileServiceClient = require('../../../../src/MobileServiceClient'),
    storeTestHelper = require('./storeTestHelper'),
    testHelper = require('../../shared/testHelper'),
    runner = require('../../../../src/Utilities/taskRunner'),
    createOperationTableManager = require('../../../../src/sync/operations').createOperationTableManager,
    MobileServiceSqliteStore = require('../../../../src/Platform/cordova/MobileServiceSqliteStore'),
    store,
    client,
    syncContext,
    tableName = storeTestHelper.testTableName,
    purgeManager;
$testGroup('purge tests').beforeEachAsync(function() {
  return storeTestHelper.createEmptyStore().then(function(emptyStore) {
    store = emptyStore;
    purgeManager = createPurgeManager(store, runner());
    client = new MobileServiceClient('http://someurl');
    syncContext = client.getSyncContext();
    return store.defineTable({
      name: tableName,
      columnDefinitions: {
        id: 'string',
        text: 'text'
      }
    }).then(function() {
      return client.getSyncContext().initialize(store);
    });
  });
}).tests($test('Vanilla purge - purge query matching entire table').checkAsync(function() {
  var record1 = {
    id: '1',
    text: 'a'
  },
      record2 = {
        id: '2',
        text: 'b'
      },
      records = [record1, record2],
      tableQuery = new Query(tableName),
      purgeQuery = tableQuery;
  var actions = [[store, store.upsert, tableName, records], addIncrementalSyncState, [purgeManager, purgeManager.purge, purgeQuery], verifyIncrementalSyncStateIsRemoved, [store, store.read, tableQuery], function(result) {
    $assert.areEqual(result, []);
  }];
  return testHelper.runActions(actions);
}), $test('Vanilla purge - purge query not matching all records').checkAsync(function() {
  var record1 = {
    id: '1',
    text: 'a'
  },
      record2 = {
        id: '2',
        text: 'b'
      },
      records = [record1, record2],
      tableQuery = new Query(tableName),
      purgeQuery = new Query(tableName).where(function() {
        return this.id === '1';
      });
  var actions = [[store, store.upsert, tableName, records], addIncrementalSyncState, [purgeManager, purgeManager.purge, purgeQuery], verifyIncrementalSyncStateIsRemoved, [store, store.read, tableQuery], function(result) {
    $assert.areEqual(result, [record2]);
  }];
  return testHelper.runActions(actions);
}), $test('Vanilla purge - purge query matching no record').checkAsync(function() {
  var record1 = {
    id: '1',
    text: 'a'
  },
      record2 = {
        id: '2',
        text: 'b'
      },
      records = [record1, record2],
      tableQuery = new Query(tableName),
      purgeQuery = new Query(tableName).where(function() {
        return this.id === 'non existent id';
      });
  var actions = [[store, store.upsert, tableName, records], addIncrementalSyncState, [purgeManager, purgeManager.purge, purgeQuery], verifyIncrementalSyncStateIsRemoved, [store, store.read, tableQuery], function(result) {
    $assert.areEqual(result, records);
  }];
  return testHelper.runActions(actions);
}), $test('Vanilla purge - pending operations in the operation table').checkAsync(function() {
  var record = {
    id: '1',
    text: 'a'
  },
      tableQuery = new Query(tableName),
      purgeQuery = tableQuery;
  var actions = [[syncContext, syncContext.insert, tableName, record], addIncrementalSyncState, [purgeManager, purgeManager.purge, purgeQuery], {fail: function(error) {}}, [store, store.read, tableQuery], function(result) {
    $assert.areEqual(result, [record]);
  }, [store, store.read, new Query(tableConstants.operationTableName)], function(result) {
    $assert.areEqual(result.length, 1);
  }, [store, store.read, new Query(tableConstants.pulltimeTableName)], function(result) {
    var incrementalSyncReset = true;
    result.forEach(function(record) {
      if (record.tableName === tableName) {
        incrementalSyncReset = false;
      }
    });
    $assert.isFalse(incrementalSyncReset);
  }];
  return testHelper.runActions(actions);
}), $test('Force purge - pending operations in the operation table').checkAsync(function() {
  var record = {
    id: '1',
    text: 'a'
  },
      tableQuery = new Query(tableName),
      purgeQuery = tableQuery;
  var actions = [[syncContext, syncContext.insert, tableName, record], addIncrementalSyncState, [purgeManager, purgeManager.purge, purgeQuery, true], verifyIncrementalSyncStateIsRemoved, verifyPendingOperationsAreRemoved, [store, store.read, tableQuery], function(result) {
    $assert.areEqual(result, []);
  }];
  return testHelper.runActions(actions);
}));
function addIncrementalSyncState() {
  return store.upsert(tableConstants.pulltimeTableName, [{
    id: '1',
    tableName: tableName,
    value: new Date()
  }, {
    id: '2',
    tableName: 'someothertablename',
    value: new Date()
  }]).then(function() {}, function(error) {
    $assert.fail(error);
  });
}
function verifyIncrementalSyncStateIsRemoved() {
  return store.read(new Query(tableConstants.pulltimeTableName)).then(function(result) {
    result.forEach(function(record) {
      if (record.tableName === tableName) {
        $assert.fail('incremental sync state not reset');
      }
    });
  }, function(error) {
    $assert.fail(error);
  });
}
function verifyPendingOperationsAreRemoved() {
  var query = new Query(tableConstants.operationTableName).where(function(tableName) {
    return this.tableName === tableName;
  }, tableName);
  return store.read(query).then(function(result) {
    $assert.areEqual(result, []);
  }, function(error) {
    $assert.fail(error);
  });
}
