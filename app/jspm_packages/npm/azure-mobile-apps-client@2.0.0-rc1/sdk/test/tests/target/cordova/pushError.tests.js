/* */ 
var Platform = require('../../../../src/Platform/index'),
    Query = require('azure-query-js').Query,
    tableConstants = require('../../../../src/constants').table,
    storeTestHelper = require('./storeTestHelper'),
    runner = require('../../../../src/Utilities/taskRunner'),
    createOperationTableManager = require('../../../../src/sync/operations').createOperationTableManager,
    createPushError = require('../../../../src/sync/pushError').createPushError,
    MobileServiceSqliteStore = require('../../../../src/Platform/cordova/MobileServiceSqliteStore');
var operationTableName = tableConstants.operationTableName,
    store,
    testVersion = 'someversion',
    testId = 'someid';
$testGroup('pushError tests').beforeEachAsync(function() {
  return storeTestHelper.createEmptyStore().then(function(emptyStore) {
    store = emptyStore;
  });
}).tests($test('pushError.update()').description('verify update() uses whatever metadata is returned by operationTableManager.getMetadata()').checkAsync(function() {
  var testId = 'someid',
      operationTableManager = createOperationTableManager(store),
      pushOperation = {
        logRecord: {
          id: 101,
          tableName: storeTestHelper.testTableName,
          action: 'someaction',
          itemId: testId,
          metadata: {}
        },
        data: {id: testId}
      },
      pushError = createPushError(store, operationTableManager, runner(), pushOperation, 'some-error');
  var batchExecuted;
  store.executeBatch = function(batch) {
    return Platform.async(function(callback) {
      $assert.areEqual(batch[0].data.metadata, 'some-metadata');
      batchExecuted = true;
      callback();
    })();
  };
  operationTableManager.getMetadata = function() {
    return Platform.async(function(callback) {
      return callback(null, 'some-metadata');
    })();
  };
  return pushError.update({id: testId}).then(function() {
    $assert.isTrue(batchExecuted);
  });
}), $test('pushError.changeAction() - new action is insert, new record value specifies version').checkAsync(function() {
  return verifyChangeAction('update', 'insert', testId, testId, undefined, testVersion, true, testVersion);
}), $test('pushError.changeAction() - new action is insert, new record value specifies different ID').checkAsync(function() {
  return verifyChangeAction('update', 'insert', testId, 'changed id', testVersion, testVersion, false);
}), $test('pushError.changeAction() - new action is insert, new record value not specified, old action is update').checkAsync(function() {
  return verifyChangeAction('update', 'insert', testId, undefined, testVersion, undefined, true, testVersion);
}), $test('pushError.changeAction() - new action is insert, new record value not specified, old action is delete').checkAsync(function() {
  return verifyChangeAction('delete', 'insert', testId, undefined, testVersion, undefined, false);
}), $test('pushError.changeAction() - new action is update, new record value specifies version').checkAsync(function() {
  return verifyChangeAction('insert', 'update', testId, testId, undefined, testVersion, true, testVersion);
}), $test('pushError.changeAction() - new action is update, new record value specifies different ID').checkAsync(function() {
  return verifyChangeAction('update', 'update', testId, 'changed id', testVersion, testVersion, false);
}), $test('pushError.changeAction() - new action is update, new record value not specified, old action is insert').checkAsync(function() {
  return verifyChangeAction('insert', 'update', testId, undefined, testVersion, undefined, true, testVersion);
}), $test('pushError.changeAction() - new action is update, new record value not specified, old action is delete').checkAsync(function() {
  return verifyChangeAction('delete', 'update', testId, undefined, testVersion, undefined, false);
}), $test('pushError.changeAction() - new action is delete, new record value specifies version').checkAsync(function() {
  return verifyChangeAction('insert', 'delete', testId, testId, undefined, testVersion, true, testVersion);
}), $test('pushError.changeAction() - new action is delete, new record value specifies different ID').checkAsync(function() {
  return verifyChangeAction('update', 'delete', testId, 'changed id', testVersion, testVersion, false);
}), $test('pushError.changeAction() - new action is delete, new record value not specified, old action is insert').checkAsync(function() {
  return verifyChangeAction('insert', 'delete', testId, undefined, testVersion, undefined, true, testVersion);
}), $test('pushError.changeAction() - new action is update, new record value not specified, old action is delete').checkAsync(function() {
  return verifyChangeAction('delete', 'update', testId, undefined, testVersion, undefined, false);
}));
function verifyChangeAction(oldAction, newAction, oldItemId, newItemId, oldVersion, newVersion, isSuccessExpected, expectedVersion) {
  var testId = 'someid',
      operationTableManager = createOperationTableManager(store),
      pushOperation = {
        logRecord: {
          id: 101,
          tableName: storeTestHelper.testTableName,
          action: oldAction,
          itemId: oldItemId,
          metadata: {version: oldVersion}
        },
        data: {id: oldItemId}
      },
      pushError = createPushError(store, operationTableManager, runner(), pushOperation, 'some-error');
  var batchExecuted;
  store.executeBatch = function(batch) {
    return Platform.async(function(callback) {
      batchExecuted = batch;
      callback();
    })();
  };
  var newRecord;
  if (newItemId) {
    newRecord = {
      id: newItemId,
      version: newVersion
    };
  }
  return pushError.changeAction(newAction, newRecord).then(function() {
    $assert.isTrue(isSuccessExpected);
    $assert.areEqual(batchExecuted[0].data.metadata.version, expectedVersion);
    $assert.areEqual(batchExecuted[0].data.action, newAction);
    if (newAction === 'delete') {
      $assert.areEqual(batchExecuted.length, 2);
      $assert.areEqual(batchExecuted[1].action, 'delete');
    }
  }, function(error) {
    $assert.isNull(batchExecuted);
    $assert.isFalse(isSuccessExpected);
  });
}
