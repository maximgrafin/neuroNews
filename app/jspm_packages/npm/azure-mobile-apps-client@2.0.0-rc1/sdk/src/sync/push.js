/* */ 
var Validate = require('../Utilities/Validate'),
    Query = require('azure-query-js').Query,
    verror = require('verror'),
    Platform = require('../Platform/index'),
    taskRunner = require('../Utilities/taskRunner'),
    MobileServiceTable = require('../MobileServiceTable'),
    constants = require('../constants'),
    tableConstants = constants.table,
    sysProps = require('../constants').table.sysProps,
    createPushError = require('./pushError').createPushError,
    handlePushError = require('./pushError').handlePushError,
    _ = require('../Utilities/Extensions');
function createPushManager(client, store, storeTaskRunner, operationTableManager) {
  var pushTaskRunner = taskRunner(),
      lastProcessedOperationId,
      pushConflicts,
      lastFailedOperationId,
      retryCount,
      maxRetryCount = 5,
      pushHandler;
  return {push: push};
  function push(handler) {
    return pushTaskRunner.run(function() {
      reset();
      pushHandler = handler;
      return pushAllOperations().then(function() {
        return pushConflicts;
      });
    });
  }
  function reset() {
    lastProcessedOperationId = -1;
    lastFailedOperationId = -1;
    retryCount = 0;
    pushConflicts = [];
  }
  function pushAllOperations() {
    var currentOperation,
        pushError;
    return readAndLockFirstPendingOperation().then(function(pendingOperation) {
      if (!pendingOperation) {
        return;
      }
      var currentOperation = pendingOperation;
      return pushOperation(currentOperation).then(function() {
        return removeLockedOperation();
      }, function(error) {
        return unlockPendingOperation().then(function() {
          pushError = createPushError(store, operationTableManager, storeTaskRunner, currentOperation, error);
          if (lastFailedOperationId !== currentOperation.logRecord.id) {
            lastFailedOperationId = currentOperation.logRecord.id;
            retryCount = 0;
          }
          if (retryCount < maxRetryCount) {
            ++retryCount;
            return handlePushError(pushError, pushHandler);
          }
        });
      }).then(function() {
        if (!pushError) {
          lastProcessedOperationId = currentOperation.logRecord.id;
        } else if (pushError && !pushError.isHandled) {
          if (pushError.isConflict()) {
            lastProcessedOperationId = currentOperation.logRecord.id;
            pushConflicts.push(pushError);
          } else {
            throw new verror.VError(pushError.getError(), 'Push failed while pushing operation for tableName : ' + currentOperation.logRecord.tableName + ', action: ' + currentOperation.logRecord.action + ', and record ID: ' + currentOperation.logRecord.itemId);
          }
        } else {}
      }).then(function() {
        return pushAllOperations();
      });
    });
  }
  function readAndLockFirstPendingOperation() {
    return storeTaskRunner.run(function() {
      var pendingOperation;
      return operationTableManager.readFirstPendingOperationWithData(lastProcessedOperationId).then(function(operation) {
        pendingOperation = operation;
        if (!pendingOperation) {
          return;
        }
        return operationTableManager.lockOperation(pendingOperation.logRecord.id);
      }).then(function() {
        return pendingOperation;
      });
    });
  }
  function unlockPendingOperation() {
    return storeTaskRunner.run(function() {
      return operationTableManager.unlockOperation();
    });
  }
  function removeLockedOperation() {
    return storeTaskRunner.run(function() {
      return operationTableManager.removeLockedOperation();
    });
  }
  function pushOperation(operation) {
    return Platform.async(function(callback) {
      callback();
    })().then(function() {}).then(function() {
      var mobileServiceTable = client.getTable(operation.logRecord.tableName);
      mobileServiceTable._features = [constants.features.OfflineSync];
      switch (operation.logRecord.action) {
        case 'insert':
          removeSysProps(operation.data);
          return mobileServiceTable.insert(operation.data).then(function(result) {
            return store.upsert(operation.logRecord.tableName, result);
          });
        case 'update':
          return mobileServiceTable.update(operation.data).then(function(result) {
            return store.upsert(operation.logRecord.tableName, result);
          });
        case 'delete':
          operation.logRecord.metadata = operation.logRecord.metadata || {};
          return mobileServiceTable.del({
            id: operation.logRecord.itemId,
            version: operation.logRecord.metadata.version
          });
        default:
          throw new Error('Unsupported action ' + operation.logRecord.action);
      }
    }).then(function() {});
  }
  function removeSysProps(record) {
    for (var i in sysProps) {
      delete record[sysProps[i]];
    }
  }
}
exports.createPushManager = createPushManager;
