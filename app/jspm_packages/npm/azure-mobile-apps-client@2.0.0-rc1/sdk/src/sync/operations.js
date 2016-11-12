/* */ 
var Validate = require('../Utilities/Validate'),
    Platform = require('../Platform/index'),
    ColumnType = require('./ColumnType'),
    taskRunner = require('../Utilities/taskRunner'),
    tableConstants = require('../constants').table,
    _ = require('../Utilities/Extensions'),
    Query = require('azure-query-js').Query;
var idPropertyName = tableConstants.idPropertyName,
    versionColumnName = tableConstants.sysProps.versionColumnName,
    operationTableName = tableConstants.operationTableName;
function createOperationTableManager(store) {
  Validate.isObject(store);
  Validate.notNull(store);
  var runner = taskRunner(),
      isInitialized,
      maxOperationId = 0,
      lockedOperationId,
      maxId;
  var api = {
    initialize: initialize,
    lockOperation: lockOperation,
    unlockOperation: unlockOperation,
    readPendingOperations: readPendingOperations,
    readFirstPendingOperationWithData: readFirstPendingOperationWithData,
    removeLockedOperation: removeLockedOperation,
    getLoggingOperation: getLoggingOperation,
    getMetadata: getMetadata
  };
  api._getOperationForInsertingLog = getOperationForInsertingLog;
  api._getOperationForUpdatingLog = getOperationForUpdatingLog;
  return api;
  function initialize() {
    return store.defineTable({
      name: operationTableName,
      columnDefinitions: {
        id: ColumnType.Integer,
        tableName: ColumnType.String,
        action: ColumnType.String,
        itemId: ColumnType.String,
        metadata: ColumnType.Object
      }
    }).then(function() {
      return getMaxOperationId();
    }).then(function(id) {
      maxId = id;
      isInitialized = true;
    });
  }
  function lockOperation(id) {
    return runner.run(function() {
      if (lockedOperationId === id) {
        return;
      }
      if (!lockedOperationId) {
        lockedOperationId = id;
        return;
      }
      throw new Error('Only one operation can be locked at a time');
    });
  }
  function unlockOperation() {
    return runner.run(function() {
      lockedOperationId = undefined;
    });
  }
  function getLoggingOperation(tableName, action, item) {
    return runner.run(function() {
      Validate.notNull(tableName);
      Validate.isString(tableName);
      Validate.notNull(action);
      Validate.isString(action);
      Validate.notNull(item);
      Validate.isObject(item);
      Validate.isValidId(item[idPropertyName]);
      if (!isInitialized) {
        throw new Error('Operation table manager is not initialized');
      }
      return readPendingOperations(tableName, item[idPropertyName]).then(function(pendingOperations) {
        var pendingOperation = pendingOperations.pop(),
            condenseAction;
        if (pendingOperation) {
          condenseAction = getCondenseAction(pendingOperation, action);
        } else {
          condenseAction = 'add';
        }
        if (condenseAction === 'add') {
          return getOperationForInsertingLog(tableName, action, item);
        } else if (condenseAction === 'modify') {
          return getOperationForUpdatingLog(pendingOperation.id, tableName, action, item);
        } else if (condenseAction === 'remove') {
          return getOperationForDeletingLog(pendingOperation.id);
        } else if (condenseAction === 'nop') {
          return;
        } else {
          throw new Error('Unknown condenseAction: ' + condenseAction);
        }
      });
    });
  }
  function readPendingOperations(tableName, itemId) {
    return Platform.async(function(callback) {
      callback();
    })().then(function() {
      var query = new Query(operationTableName);
      return store.read(query.where(function(tableName, itemId) {
        return this.tableName === tableName && this.itemId === itemId;
      }, tableName, itemId).orderBy('id'));
    });
  }
  function readFirstPendingOperationWithData(lastProcessedOperationId) {
    return runner.run(function() {
      return readFirstPendingOperationWithDataInternal(lastProcessedOperationId);
    });
  }
  function removeLockedOperation() {
    return removePendingOperation(lockedOperationId).then(function() {
      return unlockOperation();
    });
  }
  function isLocked(operation) {
    return operation && operation.id === lockedOperationId;
  }
  function readFirstPendingOperationWithDataInternal(lastProcessedOperationId) {
    var logRecord,
        query = new Query(operationTableName).where(function(lastProcessedOperationId) {
          return this.id > lastProcessedOperationId;
        }, lastProcessedOperationId).orderBy('id').take(1);
    return store.read(query).then(function(result) {
      if (result.length === 1) {
        logRecord = result[0];
      } else if (result.length === 0) {
        return;
      } else {
        throw new Error('Something is wrong!');
      }
    }).then(function() {
      if (!logRecord) {
        return;
      }
      if (logRecord.action === 'delete') {
        return {logRecord: logRecord};
      }
      return store.lookup(logRecord.tableName, logRecord.itemId, true).then(function(data) {
        if (data) {
          return {
            logRecord: logRecord,
            data: data
          };
        }
        return removePendingOperationInternal(logRecord.id).then(function() {
          lastProcessedOperationId = logRecord.id;
          return readFirstPendingOperationWithDataInternal(lastProcessedOperationId);
        });
      });
    });
  }
  function removePendingOperation(id) {
    return runner.run(function() {
      return removePendingOperationInternal(id);
    });
  }
  function removePendingOperationInternal(id) {
    return Platform.async(function(callback) {
      callback();
    })().then(function() {
      if (!id) {
        throw new Error('Invalid operation id');
      }
      return store.del(operationTableName, id);
    });
  }
  function getCondenseAction(pendingOperation, newAction) {
    var pendingAction = pendingOperation.action,
        condenseAction;
    if (pendingAction === 'insert' && newAction === 'update') {
      condenseAction = 'nop';
    } else if (pendingAction === 'insert' && newAction === 'delete') {
      condenseAction = 'remove';
    } else if (pendingAction === 'update' && newAction === 'update') {
      condenseAction = 'nop';
    } else if (pendingAction === 'update' && newAction === 'delete') {
      condenseAction = 'modify';
    } else if (pendingAction === 'delete' && newAction === 'delete') {
      condenseAction = 'nop';
    } else if (pendingAction === 'delete') {
      throw new Error('Operation ' + newAction + ' not supported as a DELETE operation is pending');
    } else {
      throw new Error('Condense not supported when pending action is ' + pendingAction + ' and new action is ' + newAction);
    }
    if (isLocked(pendingOperation)) {
      condenseAction = 'add';
    }
    return condenseAction;
  }
  function getOperationForInsertingLog(tableName, action, item) {
    return api.getMetadata(tableName, action, item).then(function(metadata) {
      return {
        tableName: operationTableName,
        action: 'upsert',
        data: {
          id: ++maxId,
          tableName: tableName,
          action: action,
          itemId: item[idPropertyName],
          metadata: metadata
        }
      };
    });
  }
  function getOperationForUpdatingLog(operationId, tableName, action, item) {
    return api.getMetadata(tableName, action, item).then(function(metadata) {
      return {
        tableName: operationTableName,
        action: 'upsert',
        data: {
          id: operationId,
          action: action,
          metadata: metadata
        }
      };
    });
  }
  function getOperationForDeletingLog(operationId) {
    return {
      tableName: operationTableName,
      action: 'delete',
      id: operationId
    };
  }
  function getMetadata(tableName, action, item) {
    return Platform.async(function(callback) {
      callback();
    })().then(function() {
      var metadata = {};
      if (action === 'upsert' || action === 'insert' || (action === 'update' && item.hasOwnProperty(versionColumnName))) {
        metadata[versionColumnName] = item[versionColumnName];
        return metadata;
      } else if (action == 'update' || action === 'delete') {
        return store.lookup(tableName, item[idPropertyName], true).then(function(result) {
          if (result) {
            metadata[versionColumnName] = result[versionColumnName];
          }
          return metadata;
        });
      } else {
        throw new Error('Invalid action ' + action);
      }
    });
  }
  function getMaxOperationId() {
    var query = new Query(operationTableName);
    return store.read(query.orderByDescending('id').take(1)).then(function(result) {
      Validate.isArray(result);
      if (result.length === 0) {
        return 0;
      } else if (result.length === 1) {
        return result[0].id;
      } else {
        throw new Error('something is wrong!');
      }
    });
  }
}
module.exports = {createOperationTableManager: createOperationTableManager};
