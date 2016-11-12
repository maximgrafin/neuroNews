/* */ 
var Validate = require('../Utilities/Validate'),
    Platform = require('../Platform/index'),
    createOperationTableManager = require('./operations').createOperationTableManager,
    taskRunner = require('../Utilities/taskRunner'),
    createPullManager = require('./pull').createPullManager,
    createPushManager = require('./push').createPushManager,
    createPurgeManager = require('./purge').createPurgeManager,
    uuid = require('node-uuid'),
    _ = require('../Utilities/Extensions');
function MobileServiceSyncContext(client) {
  Validate.notNull(client, 'client');
  var store,
      operationTableManager,
      pullManager,
      pushManager,
      purgeManager,
      isInitialized = false,
      syncTaskRunner = taskRunner(),
      storeTaskRunner = taskRunner();
  this.initialize = function(localStore) {
    return Platform.async(function(callback) {
      Validate.isObject(localStore);
      Validate.notNull(localStore);
      callback(null, createOperationTableManager(localStore));
    })().then(function(opManager) {
      operationTableManager = opManager;
      return operationTableManager.initialize(localStore);
    }).then(function() {
      store = localStore;
      pullManager = createPullManager(client, store, storeTaskRunner, operationTableManager);
      pushManager = createPushManager(client, store, storeTaskRunner, operationTableManager);
      purgeManager = createPurgeManager(store, storeTaskRunner);
    }).then(function() {
      return pullManager.initialize();
    }).then(function() {
      isInitialized = true;
    });
  };
  this.insert = function(tableName, instance) {
    return storeTaskRunner.run(function() {
      validateInitialization();
      if (_.isNull(instance.id)) {
        instance.id = uuid.v4();
      }
      return upsertWithLogging(tableName, instance, 'insert');
    });
  };
  this.update = function(tableName, instance) {
    return storeTaskRunner.run(function() {
      validateInitialization();
      return upsertWithLogging(tableName, instance, 'update', true);
    });
  };
  this.lookup = function(tableName, id, suppressRecordNotFoundError) {
    return Platform.async(function(callback) {
      validateInitialization();
      Validate.isString(tableName, 'tableName');
      Validate.notNullOrEmpty(tableName, 'tableName');
      Validate.isValidId(id, 'id');
      if (!store) {
        throw new Error('MobileServiceSyncContext not initialized');
      }
      callback();
    })().then(function() {
      return store.lookup(tableName, id, suppressRecordNotFoundError);
    });
  };
  this.read = function(query) {
    return Platform.async(function(callback) {
      callback();
    })().then(function() {
      validateInitialization();
      Validate.notNull(query, 'query');
      Validate.isObject(query, 'query');
      return store.read(query);
    });
  };
  this.del = function(tableName, instance) {
    return storeTaskRunner.run(function() {
      validateInitialization();
      Validate.isString(tableName, 'tableName');
      Validate.notNullOrEmpty(tableName, 'tableName');
      Validate.notNull(instance);
      Validate.isValidId(instance.id);
      if (!store) {
        throw new Error('MobileServiceSyncContext not initialized');
      }
      return operationTableManager.getLoggingOperation(tableName, 'delete', instance).then(function(loggingOperation) {
        return store.executeBatch([{
          action: 'delete',
          tableName: tableName,
          id: instance.id
        }, loggingOperation]);
      });
    });
  };
  this.pull = function(query, queryId, settings) {
    return syncTaskRunner.run(function() {
      validateInitialization();
      return pullManager.pull(query, queryId, settings);
    });
  };
  this.push = function() {
    return syncTaskRunner.run(function() {
      validateInitialization();
      return pushManager.push(this.pushHandler);
    }.bind(this));
  };
  this.purge = function(query, forcePurge) {
    return syncTaskRunner.run(function() {
      Validate.isObject(query, 'query');
      Validate.notNull(query, 'query');
      if (!_.isNull(forcePurge)) {
        Validate.isBool(forcePurge, 'forcePurge');
      }
      validateInitialization();
      return purgeManager.purge(query, forcePurge);
    }.bind(this));
  };
  this.pushHandler = undefined;
  this._getOperationTableManager = function() {
    return operationTableManager;
  };
  this._getPurgeManager = function() {
    return purgeManager;
  };
  function upsertWithLogging(tableName, instance, action, shouldOverwrite) {
    Validate.isString(tableName, 'tableName');
    Validate.notNullOrEmpty(tableName, 'tableName');
    Validate.notNull(instance, 'instance');
    Validate.isValidId(instance.id, 'instance.id');
    if (!store) {
      throw new Error('MobileServiceSyncContext not initialized');
    }
    return store.lookup(tableName, instance.id, true).then(function(existingRecord) {
      if (existingRecord && !shouldOverwrite) {
        throw new Error('Record with id ' + existingRecord.id + ' already exists in the table ' + tableName);
      }
    }).then(function() {
      return operationTableManager.getLoggingOperation(tableName, action, instance);
    }).then(function(loggingOperation) {
      return store.executeBatch([{
        action: 'upsert',
        tableName: tableName,
        data: instance
      }, loggingOperation]);
    }).then(function() {
      return instance;
    });
  }
  function validateInitialization() {
    if (!isInitialized) {
      throw new Error('MobileServiceSyncContext is being used before it is initialized');
    }
  }
}
module.exports = MobileServiceSyncContext;
