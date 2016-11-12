/* */ 
var Platform = require('../Platform/index'),
    _ = require('../Utilities/Extensions'),
    tableConstants = require('../constants').table;
var operationTableName = tableConstants.operationTableName,
    deletedColumnName = tableConstants.sysProps.deletedColumnName;
function createPushError(store, operationTableManager, storeTaskRunner, pushOperation, operationError) {
  return {
    isHandled: false,
    getError: getError,
    isConflict: isConflict,
    getTableName: getTableName,
    getAction: getAction,
    getServerRecord: getServerRecord,
    getClientRecord: getClientRecord,
    cancelAndUpdate: cancelAndUpdate,
    cancelAndDiscard: cancelAndDiscard,
    cancel: cancel,
    update: update,
    changeAction: changeAction
  };
  function getTableName() {
    return makeCopy(pushOperation.logRecord.tableName);
  }
  function getAction() {
    return makeCopy(pushOperation.logRecord.action);
  }
  function getServerRecord() {
    return makeCopy(operationError.serverInstance);
  }
  function getClientRecord() {
    return makeCopy(pushOperation.data);
  }
  function getError() {
    return makeCopy(operationError);
  }
  function isConflict() {
    return operationError.request.status === 409 || operationError.request.status === 412;
  }
  function cancelAndUpdate(newValue) {
    var self = this;
    return storeTaskRunner.run(function() {
      if (pushOperation.logRecord.action === 'delete') {
        throw new Error('Cannot update a deleted record');
      }
      if (_.isNull(newValue)) {
        throw new Error('Need a valid object to update the record');
      }
      if (!_.isValidId(newValue.id)) {
        throw new Error('Invalid ID: ' + newValue.id);
      }
      if (newValue.id !== pushOperation.data.id) {
        throw new Error('Only updating the record being pushed is allowed');
      }
      var dataUpdateOperation = {
        tableName: pushOperation.logRecord.tableName,
        action: 'upsert',
        data: newValue
      };
      var logDeleteOperation = {
        tableName: operationTableName,
        action: 'delete',
        id: pushOperation.logRecord.id
      };
      var operations = [dataUpdateOperation, logDeleteOperation];
      return store.executeBatch(operations).then(function() {
        self.isHandled = true;
      });
    });
  }
  function cancelAndDiscard() {
    var self = this;
    return storeTaskRunner.run(function() {
      var dataDeleteOperation = {
        tableName: pushOperation.logRecord.tableName,
        action: 'delete',
        id: pushOperation.logRecord.itemId
      };
      var logDeleteOperation = {
        tableName: operationTableName,
        action: 'delete',
        id: pushOperation.logRecord.id
      };
      var operations = [dataDeleteOperation, logDeleteOperation];
      return store.executeBatch(operations).then(function() {
        self.isHandled = true;
      });
    });
  }
  function update(newValue) {
    var self = this;
    return storeTaskRunner.run(function() {
      if (pushOperation.logRecord.action === 'delete') {
        throw new Error('Cannot update a deleted record');
      }
      if (_.isNull(newValue)) {
        throw new Error('Need a valid object to update the record');
      }
      if (!_.isValidId(newValue.id)) {
        throw new Error('Invalid ID: ' + newValue.id);
      }
      if (newValue.id !== pushOperation.data.id) {
        throw new Error('Only updating the record being pushed is allowed');
      }
      return operationTableManager.getMetadata(pushOperation.logRecord.tableName, 'upsert', newValue).then(function(metadata) {
        pushOperation.logRecord.metadata = metadata;
        return store.executeBatch([{
          tableName: operationTableName,
          action: 'upsert',
          data: pushOperation.logRecord
        }, {
          tableName: pushOperation.logRecord.tableName,
          action: 'upsert',
          data: newValue
        }]).then(function() {
          self.isHandled = this;
        });
      });
    });
  }
  function changeAction(newAction, newClientRecord) {
    var self = this;
    return storeTaskRunner.run(function() {
      var dataOperation,
          logOperation = {
            tableName: operationTableName,
            action: 'upsert',
            data: makeCopy(pushOperation.logRecord)
          };
      if (newClientRecord) {
        if (!newClientRecord.id) {
          throw new Error('New client record value must specify the record ID');
        }
        if (newClientRecord.id !== pushOperation.logRecord.itemId) {
          throw new Error('New client record value cannot change the record ID. Original ID: ' + pushOperation.logRecord.id + ' New ID: ' + newClientRecord.id);
        }
        logOperation.data.metadata = logOperation.data.metadata || {};
        logOperation.data.metadata[tableConstants.sysProps.versionColumnName] = newClientRecord[tableConstants.sysProps.versionColumnName];
      }
      if (newAction === 'insert' || newAction === 'update') {
        var oldAction = logOperation.data.action;
        logOperation.data.action = newAction;
        if (newClientRecord) {
          dataOperation = {
            tableName: pushOperation.logRecord.tableName,
            action: 'upsert',
            data: newClientRecord
          };
        } else if (oldAction !== 'insert' && oldAction !== 'update') {
          throw new Error('Changing action from ' + oldAction + ' to ' + newAction + ' without specifying a value for the associated record is not allowed!');
        }
      } else if (newAction === 'delete' || newAction === 'del') {
        logOperation.data.action = 'delete';
        dataOperation = {
          tableName: pushOperation.logRecord.tableName,
          action: 'delete',
          id: pushOperation.logRecord.id
        };
      } else {
        throw new Error('Action ' + newAction + ' not supported.');
      }
      return store.executeBatch([logOperation, dataOperation]).then(function() {
        self.isHandled = true;
      });
    });
  }
  function cancel() {
    var self = this;
    return storeTaskRunner.run(function() {
      return store.del(operationTableName, pushOperation.logRecord.id).then(function() {
        self.isHandled = true;
      });
    });
  }
}
function makeCopy(value) {
  if (!_.isNull(value)) {
    value = JSON.parse(JSON.stringify(value));
  }
  return value;
}
function handlePushError(pushError, pushHandler) {
  return Platform.async(function(callback) {
    callback();
  })().then(function() {
    if (pushError.isConflict()) {
      if (pushHandler && pushHandler.onConflict) {
        return pushHandler.onConflict(pushError);
      }
    } else if (pushHandler && pushHandler.onError) {
      return pushHandler.onError(pushError);
    }
  }).then(undefined, function(error) {
    pushError.isHandled = false;
  });
}
exports.createPushError = createPushError;
exports.handlePushError = handlePushError;
