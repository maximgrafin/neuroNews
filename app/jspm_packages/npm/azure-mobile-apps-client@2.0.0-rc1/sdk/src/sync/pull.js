/* */ 
(function(process) {
  var Validate = require('../Utilities/Validate'),
      Query = require('azure-query-js').Query,
      Platform = require('../Platform/index'),
      taskRunner = require('../Utilities/taskRunner'),
      MobileServiceTable = require('../MobileServiceTable'),
      constants = require('../constants'),
      tableConstants = constants.table,
      _ = require('../Utilities/Extensions');
  var defaultPageSize = 50,
      idPropertyName = tableConstants.idPropertyName,
      pulltimeTableName = tableConstants.pulltimeTableName,
      sysProps = tableConstants.sysProps;
  function createPullManager(client, store, storeTaskRunner, operationTableManager) {
    var pullTaskRunner = taskRunner(),
        mobileServiceTable,
        pageSize,
        lastKnownUpdatedAt,
        tablePullQuery,
        pagePullQuery,
        pullQueryId;
    return {
      initialize: initialize,
      pull: pull
    };
    function initialize() {
      return pullTaskRunner.run(function() {
        return store.defineTable({
          name: pulltimeTableName,
          columnDefinitions: {
            id: 'string',
            tableName: 'string',
            value: 'date'
          }
        });
      });
    }
    function pull(query, queryId, settings) {
      return pullTaskRunner.run(function() {
        validateQuery(query, 'query');
        Validate.isString(queryId, 'queryId');
        Validate.isObject(settings, 'settings');
        settings = settings || {};
        if (_.isNull(settings.pageSize)) {
          pageSize = defaultPageSize;
        } else if (_.isInteger(settings.pageSize) && settings.pageSize > 0) {
          pageSize = settings.pageSize;
        } else {
          throw new Error('Page size must be a positive integer. Page size ' + settings.pageSize + ' is invalid.');
        }
        tablePullQuery = copyQuery(query);
        mobileServiceTable = client.getTable(tablePullQuery.getComponents().table);
        mobileServiceTable._features = queryId ? [constants.features.OfflineSync, constants.features.IncrementalPull] : [constants.features.OfflineSync];
        pullQueryId = queryId;
        return setupQuery().then(function() {
          return pullAllPages();
        });
      });
    }
    function setupQuery() {
      return getLastKnownUpdatedAt().then(function(updatedAt) {
        buildQueryFromLastKnownUpdateAt(updatedAt);
      });
    }
    function pullAllPages() {
      return pullPage().then(function(pulledRecords) {
        if (!isPullComplete(pulledRecords)) {
          return updateQueryForNextPage(pulledRecords).then(function() {
            return pullAllPages();
          });
        }
      });
    }
    function isPullComplete(pulledRecords) {
      return pulledRecords.length === 0;
    }
    function pullPage() {
      var params = {};
      params[tableConstants.includeDeletedFlag] = true;
      var pulledRecords;
      var queryString = pagePullQuery.toOData();
      var tableName = pagePullQuery.getComponents().table;
      queryString = queryString.replace(new RegExp('^/' + tableName), '').replace("datetime'", "datetimeoffset'");
      return mobileServiceTable.read(queryString, params).then(function(result) {
        pulledRecords = result;
        var chain = Platform.async(function(callback) {
          callback();
        })();
        for (var i in pulledRecords) {
          chain = processPulledRecord(chain, tableName, pulledRecords[i]);
        }
        return chain;
      }).then(function(pulled) {
        return onPagePulled();
      }).then(function() {
        return pulledRecords;
      });
    }
    function processPulledRecord(chain, tableName, pulledRecord) {
      return chain.then(function() {
        return storeTaskRunner.run(function() {
          if (Validate.isValidId(pulledRecord[idPropertyName])) {
            throw new Error('Pulled record does not have a valid ID');
          }
          return operationTableManager.readPendingOperations(tableName, pulledRecord[idPropertyName]).then(function(pendingOperations) {
            if (pendingOperations.length > 0) {
              return;
            }
            if (pulledRecord[sysProps.deletedColumnName] === true) {
              return store.del(tableName, pulledRecord.id);
            } else if (pulledRecord[sysProps.deletedColumnName] === false) {
              return store.upsert(tableName, pulledRecord);
            } else {
              throw new Error("'" + sysProps.deletedColumnName + "' system property is missing. Pull cannot work without it.'");
            }
          });
        });
      });
    }
    function getLastKnownUpdatedAt() {
      return Platform.async(function(callback) {
        callback();
      })().then(function() {
        if (pullQueryId) {
          return store.lookup(pulltimeTableName, pullQueryId, true);
        }
      }).then(function(result) {
        if (result) {
          return result.value;
        }
        return new Date(1970, 0, 0);
      });
    }
    function updateQueryForNextPage(pulledRecords) {
      return Platform.async(function(callback) {
        callback();
      })().then(function() {
        if (!pulledRecords) {
          throw new Error('Something is wrong. pulledRecords cannot be null at this point');
        }
        var lastRecord = pulledRecords[pulledRecords.length - 1];
        if (!lastRecord) {
          throw new Error('Something is wrong. Possibly invalid response from the server. lastRecord cannot be null!');
        }
        var lastRecordTime = lastRecord[tableConstants.sysProps.updatedAtColumnName];
        if (!_.isDate(lastRecordTime)) {
          throw new Error('Property ' + tableConstants.sysProps.updatedAtColumnName + ' of the last record should be a valid date');
        }
        if (lastRecordTime.getTime() === lastKnownUpdatedAt.getTime()) {
          pagePullQuery.skip(pagePullQuery.getComponents().skip + pulledRecords.length);
        } else {
          buildQueryFromLastKnownUpdateAt(lastRecordTime);
        }
      });
    }
    function buildQueryFromLastKnownUpdateAt(updatedAt) {
      lastKnownUpdatedAt = updatedAt;
      pagePullQuery = copyQuery(tablePullQuery);
      pagePullQuery = pagePullQuery.where(function(lastKnownUpdatedAt) {
        return this.updatedAt >= lastKnownUpdatedAt;
      }, lastKnownUpdatedAt);
      pagePullQuery.orderBy(tableConstants.sysProps.updatedAtColumnName);
      pagePullQuery.take(pageSize);
    }
    function onPagePulled() {
      if (pullQueryId) {
        return store.upsert(pulltimeTableName, {
          id: pullQueryId,
          tableName: pagePullQuery.getComponents().table,
          value: lastKnownUpdatedAt
        });
      }
    }
    function validateQuery(query) {
      Validate.isObject(query);
      Validate.notNull(query);
      var components = query.getComponents();
      for (var i in components.ordering) {
        throw new Error('orderBy and orderByDescending clauses are not supported in the pull query');
      }
      if (components.skip) {
        throw new Error('skip is not supported in the pull query');
      }
      if (components.take) {
        throw new Error('take is not supported in the pull query');
      }
      if (components.selections && components.selections.length !== 0) {
        throw new Error('select is not supported in the pull query');
      }
      if (components.includeTotalCount) {
        throw new Error('includeTotalCount is not supported in the pull query');
      }
    }
    function copyQuery(query) {
      var components = query.getComponents();
      var queryCopy = new Query(components.table);
      queryCopy.setComponents(components);
      return queryCopy;
    }
  }
  exports.createPullManager = createPullManager;
})(require('process'));
