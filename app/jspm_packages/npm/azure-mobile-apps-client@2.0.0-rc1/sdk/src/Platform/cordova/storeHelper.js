/* */ 
var idPropertyName = require('../../constants').table.idPropertyName,
    Validate = require('../../Utilities/Validate');
function validateTableDefinition(tableDefinition) {
  Validate.notNull(tableDefinition, 'tableDefinition');
  Validate.isObject(tableDefinition, 'tableDefinition');
  Validate.isString(tableDefinition.name, 'tableDefinition.name');
  Validate.notNullOrEmpty(tableDefinition.name, 'tableDefinition.name');
  var columnDefinitions = tableDefinition.columnDefinitions,
      definedColumns = {};
  Validate.isObject(columnDefinitions);
  Validate.notNull(columnDefinitions);
  for (var columnName in columnDefinitions) {
    Validate.isString(columnDefinitions[columnName], 'columnType');
    Validate.notNullOrEmpty(columnDefinitions[columnName], 'columnType');
    if (definedColumns[columnName.toLowerCase()]) {
      throw new Error('Duplicate definition for column ' + columnName + '" in table "' + tableDefinition.name + '"');
    }
    definedColumns[columnName.toLowerCase()] = true;
  }
}
function addTableDefinition(tableDefinitions, tableDefinition) {
  Validate.isObject(tableDefinitions);
  Validate.notNull(tableDefinitions);
  validateTableDefinition(tableDefinition);
  tableDefinitions[tableDefinition.name.toLowerCase()] = tableDefinition;
}
function getTableDefinition(tableDefinitions, tableName) {
  Validate.isObject(tableDefinitions);
  Validate.notNull(tableDefinitions);
  Validate.isString(tableName);
  Validate.notNullOrEmpty(tableName);
  return tableDefinitions[tableName.toLowerCase()];
}
function getColumnType(columnDefinitions, columnName) {
  Validate.isObject(columnDefinitions);
  Validate.notNull(columnDefinitions);
  Validate.isString(columnName);
  Validate.notNullOrEmpty(columnName);
  for (var column in columnDefinitions) {
    if (column.toLowerCase() === columnName.toLowerCase()) {
      return columnDefinitions[column];
    }
  }
}
function getColumnName(columnDefinitions, property) {
  Validate.isObject(columnDefinitions);
  Validate.notNull(columnDefinitions);
  Validate.isString(property);
  Validate.notNullOrEmpty(property);
  for (var column in columnDefinitions) {
    if (column.toLowerCase() === property.toLowerCase()) {
      return column;
    }
  }
  return property;
}
function getId(record) {
  Validate.isObject(record);
  Validate.notNull(record);
  for (var property in record) {
    if (property.toLowerCase() === idPropertyName.toLowerCase()) {
      return record[property];
    }
  }
}
function isId(property) {
  Validate.isString(property);
  Validate.notNullOrEmpty(property);
  return property.toLowerCase() === idPropertyName.toLowerCase();
}
module.exports = {
  addTableDefinition: addTableDefinition,
  getColumnName: getColumnName,
  getColumnType: getColumnType,
  getId: getId,
  getTableDefinition: getTableDefinition,
  isId: isId,
  validateTableDefinition: validateTableDefinition
};
