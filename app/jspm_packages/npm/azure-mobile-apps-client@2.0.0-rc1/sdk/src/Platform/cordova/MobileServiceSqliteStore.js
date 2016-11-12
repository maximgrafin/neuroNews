/* */ 
var Platform = require('./index'),
    Validate = require('../../Utilities/Validate'),
    _ = require('../../Utilities/Extensions'),
    ColumnType = require('../../sync/ColumnType'),
    sqliteSerializer = require('./sqliteSerializer'),
    storeHelper = require('./storeHelper'),
    Query = require('azure-query-js').Query,
    formatSql = require('azure-odata-sql').format,
    taskRunner = require('../../Utilities/taskRunner'),
    idPropertyName = "id",
    defaultDbName = 'mobileapps.db';
var MobileServiceSqliteStore = function(dbName) {
  "use strict";
  if (!(this instanceof MobileServiceSqliteStore)) {
    return new MobileServiceSqliteStore(dbName);
  }
  if (_.isNull(dbName)) {
    dbName = defaultDbName;
  }
  var tableDefinitions = {},
      runner = taskRunner();
  this.init = function() {
    return runner.run(function() {
      return this._init();
    }.bind(this));
  };
  this._init = function() {
    var self = this;
    return Platform.async(function(callback) {
      if (self._db) {
        return callback();
      }
      var db = window.sqlitePlugin.openDatabase({
        name: dbName,
        location: 'default'
      }, function successcb() {
        self._db = db;
        callback();
      }, callback);
    })();
  };
  this.close = function() {
    var self = this;
    return runner.run(function() {
      if (!self._db) {
        return;
      }
      return Platform.async(function(callback) {
        self._db.close(function successcb() {
          self._db = undefined;
          callback();
        }, callback);
      })();
    });
  };
  this.defineTable = function(tableDefinition) {
    var self = this;
    return runner.run(function() {
      storeHelper.validateTableDefinition(tableDefinition);
      tableDefinition = JSON.parse(JSON.stringify(tableDefinition));
      return self._init().then(function() {
        return Platform.async(function(callback) {
          self._db.transaction(function(transaction) {
            var pragmaStatement = _.format("PRAGMA table_info({0});", tableDefinition.name);
            transaction.executeSql(pragmaStatement, [], function(transaction, result) {
              if (result.rows.length > 0) {
                var existingColumns = {};
                for (var i = 0; i < result.rows.length; i++) {
                  var column = result.rows.item(i);
                  existingColumns[column.name.toLowerCase()] = true;
                }
                addMissingColumns(transaction, tableDefinition, existingColumns);
              } else {
                createTable(transaction, tableDefinition);
              }
            });
          }, callback, function(result) {
            var error;
            try {
              storeHelper.addTableDefinition(tableDefinitions, tableDefinition);
            } catch (err) {
              error = err;
            }
            callback(error);
          });
        })();
      });
    });
  };
  this.upsert = function(tableName, data) {
    var self = this;
    return runner.run(function() {
      return Platform.async(function(callback) {
        self._db.transaction(function(transaction) {
          self._upsert(transaction, tableName, data);
        }, callback, callback);
      })();
    });
  };
  this._upsert = function(transaction, tableName, data) {
    Validate.isObject(transaction);
    Validate.notNull(transaction);
    Validate.isString(tableName, 'tableName');
    Validate.notNullOrEmpty(tableName, 'tableName');
    var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, tableName);
    if (_.isNull(tableDefinition)) {
      throw new Error('Definition not found for table "' + tableName + '"');
    }
    if (_.isNull(data)) {
      return;
    }
    Validate.isObject(data);
    var records;
    if (!_.isArray(data)) {
      records = [data];
    } else {
      records = data;
    }
    for (var i = 0; i < records.length; i++) {
      if (!_.isNull(records[i])) {
        Validate.isValidId(storeHelper.getId(records[i]), 'records[' + i + '].' + idPropertyName);
        records[i] = sqliteSerializer.serialize(records[i], tableDefinition.columnDefinitions);
      }
    }
    if (tableDefinition.columnDefinitions.length > 999) {
      throw new Error("Number of table columns cannot be more than 999");
    }
    var statements = [],
        parameters = [],
        record,
        insertColumnNames = [],
        insertParams = [],
        insertValues = [],
        updateColumnNames = [],
        updateExpressions = [],
        updateValues = [];
    for (i = 0; i < records.length; i++) {
      if (_.isNull(records[i])) {
        continue;
      }
      record = records[i];
      insertColumnNames = [];
      insertParams = [];
      insertValues = [];
      updateColumnNames = [];
      updateExpressions = [];
      updateValues = [];
      for (var property in record) {
        insertColumnNames.push(property);
        insertParams.push('?');
        insertValues.push(record[property]);
        if (!storeHelper.isId(property)) {
          updateColumnNames.push(property);
          updateExpressions.push(property + ' = ?');
          updateValues.push(record[property]);
        }
      }
      statements.push(_.format("INSERT OR IGNORE INTO {0} ({1}) VALUES ({2})", tableName, insertColumnNames.join(), insertParams.join()));
      parameters.push(insertValues);
      if (updateValues.length > 0) {
        statements.push(_.format("UPDATE {0} SET {1} WHERE {2} = ?", tableName, updateExpressions.join(), idPropertyName));
        updateValues.push(storeHelper.getId(record));
        parameters.push(updateValues);
      }
    }
    for (i = 0; i < statements.length; i++) {
      if (this._editStatement) {
        statements[i] = this._editStatement(statements[i]);
      }
      transaction.executeSql(statements[i], parameters[i]);
    }
  };
  this.lookup = function(tableName, id, suppressRecordNotFoundError) {
    var self = this;
    return runner.run(function() {
      Validate.isString(tableName, 'tableName');
      Validate.notNullOrEmpty(tableName, 'tableName');
      Validate.isValidId(id, 'id');
      var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, tableName);
      if (_.isNull(tableDefinition)) {
        throw new Error('Definition not found for table "' + tableName + '"');
      }
      var lookupStatement = _.format("SELECT * FROM [{0}] WHERE {1} = ? COLLATE NOCASE", tableName, idPropertyName);
      return Platform.async(function(callback) {
        self._db.executeSql(lookupStatement, [id], function(result) {
          var error,
              record;
          try {
            if (result.rows.length !== 0) {
              record = result.rows.item(0);
            }
            if (record) {
              record = sqliteSerializer.deserialize(record, tableDefinition.columnDefinitions);
            } else if (!suppressRecordNotFoundError) {
              throw new Error('Item with id "' + id + '" does not exist.');
            }
          } catch (err) {
            error = err;
          }
          if (error) {
            callback(error);
          } else {
            callback(null, record);
          }
        }, callback);
      })();
    });
  };
  this.del = function(tableNameOrQuery, ids) {
    var self = this;
    return runner.run(function() {
      return Platform.async(function(callback) {
        Validate.notNull(tableNameOrQuery);
        if (_.isString(tableNameOrQuery)) {
          Validate.notNullOrEmpty(tableNameOrQuery, 'tableNameOrQuery');
          if (!_.isArray(ids)) {
            ids = [ids];
          }
          self._db.transaction(function(transaction) {
            for (var i in ids) {
              if (!_.isNull(ids[i])) {
                Validate.isValidId(ids[i]);
              }
            }
            self._deleteIds(transaction, tableNameOrQuery, ids);
          }, callback, callback);
        } else if (_.isObject(tableNameOrQuery)) {
          self._deleteUsingQuery(tableNameOrQuery, callback);
        } else {
          throw _.format(Platform.getResourceString("TypeCheckError"), 'tableNameOrQuery', 'Object or String', typeof tableNameOrQuery);
        }
      })();
    });
  };
  this._deleteUsingQuery = function(query, callback) {
    var self = this;
    var components = query.getComponents();
    if (components.selections && components.selections.length > 0) {
      components.selections = [];
      query.setComponents(components);
    }
    self._read(query).then(function(result) {
      try {
        if (!_.isArray(result)) {
          result = result.result;
          Validate.isArray(result);
        }
        var tableName = query.getComponents().table;
        Validate.isString(tableName);
        Validate.notNullOrEmpty(tableName);
        var ids = [];
        result.forEach(function(record) {
          ids.push(record[idPropertyName]);
        });
        self._db.transaction(function(transaction) {
          self._deleteIds(transaction, tableName, ids);
        }, callback, callback);
      } catch (error) {
        callback(error);
      }
    }, callback);
  };
  this._deleteIds = function(transaction, tableName, ids) {
    var deleteExpressions = [],
        deleteParams = [];
    for (var i = 0; i < ids.length; i++) {
      if (!_.isNull(ids[i])) {
        deleteExpressions.push('?');
        deleteParams.push(ids[i]);
      }
    }
    var deleteStatement = _.format("DELETE FROM {0} WHERE {1} in ({2})", tableName, idPropertyName, deleteExpressions.join());
    if (this._editStatement) {
      deleteStatement = this._editStatement(deleteStatement);
    }
    transaction.executeSql(deleteStatement, deleteParams);
  };
  this.read = function(query) {
    return runner.run(function() {
      Validate.notNull(query, 'query');
      Validate.isObject(query, 'query');
      return this._read(query);
    }.bind(this));
  };
  this._read = function(query) {
    return Platform.async(function(callback) {
      var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, query.getComponents().table);
      if (_.isNull(tableDefinition)) {
        throw new Error('Definition not found for table "' + query.getComponents().table + '"');
      }
      var count,
          result = [],
          statements = getSqlStatementsFromQuery(query);
      this._db.transaction(function(transaction) {
        if (statements.length < 1 || statements.length > 2) {
          throw new Error('Unexpected number of statements');
        }
        transaction.executeSql(statements[0].sql, getStatementParameters(statements[0]), function(transaction, res) {
          var record;
          for (var j = 0; j < res.rows.length; j++) {
            record = sqliteSerializer.deserialize(res.rows.item(j), tableDefinition.columnDefinitions);
            result.push(record);
          }
        });
        if (statements.length === 2) {
          transaction.executeSql(statements[1].sql, getStatementParameters(statements[1]), function(transaction, res) {
            count = res.rows.item(0).count;
          });
        }
      }, callback, function() {
        if (count !== undefined) {
          result = {
            result: result,
            count: count
          };
        }
        callback(null, result);
      });
    }.bind(this))();
  };
  this.executeBatch = function(operations) {
    var self = this;
    return runner.run(function() {
      Validate.isArray(operations);
      return Platform.async(function(callback) {
        self._db.transaction(function(transaction) {
          for (var i in operations) {
            var operation = operations[i];
            if (_.isNull(operation)) {
              continue;
            }
            Validate.isString(operation.action);
            Validate.notNullOrEmpty(operation.action);
            Validate.isString(operation.tableName);
            Validate.notNullOrEmpty(operation.tableName);
            if (operation.action.toLowerCase() === 'upsert') {
              self._upsert(transaction, operation.tableName, operation.data);
            } else if (operation.action.toLowerCase() === 'delete') {
              if (!_.isNull(operation.id)) {
                Validate.isValidId(operation.id);
                self._deleteIds(transaction, operation.tableName, [operation.id]);
              }
            } else {
              throw new Error(_.format("Operation '{0}' is not supported", operation.action));
            }
          }
        }, callback, callback);
      })();
    });
  };
};
function getSqlStatementsFromQuery(query) {
  var odataQuery = Query.Providers.OData.toOData(query);
  var statements = formatSql(odataQuery, {flavor: 'sqlite'});
  return statements;
}
function getStatementParameters(statement) {
  var params = [];
  if (statement.parameters) {
    statement.parameters.forEach(function(param) {
      params.push(sqliteSerializer.serializeValue(param.value));
    });
  }
  return params;
}
function createTable(transaction, tableDefinition) {
  var columnDefinitions = tableDefinition.columnDefinitions;
  var columnDefinitionClauses = [];
  for (var columnName in columnDefinitions) {
    var columnType = storeHelper.getColumnType(columnDefinitions, columnName);
    var columnDefinitionClause = _.format("[{0}] {1}", columnName, sqliteSerializer.getSqliteType(columnType));
    if (storeHelper.isId(columnName)) {
      columnDefinitionClause += " PRIMARY KEY";
    }
    columnDefinitionClauses.push(columnDefinitionClause);
  }
  var createTableStatement = _.format("CREATE TABLE [{0}] ({1})", tableDefinition.name, columnDefinitionClauses.join());
  transaction.executeSql(createTableStatement);
}
function addMissingColumns(transaction, tableDefinition, existingColumns) {
  var columnDefinitions = tableDefinition.columnDefinitions;
  for (var columnName in columnDefinitions) {
    if (!existingColumns[columnName.toLowerCase()]) {
      var alterStatement = _.format("ALTER TABLE {0} ADD COLUMN {1} {2}", tableDefinition.name, columnName, storeHelper.getColumnType(columnDefinitions, columnName));
      transaction.executeSql(alterStatement);
    }
  }
}
MobileServiceSqliteStore.ColumnType = ColumnType;
module.exports = MobileServiceSqliteStore;
