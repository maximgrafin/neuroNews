/* */ 
var Platform = require('./index'),
    Validate = require('../../Utilities/Validate'),
    _ = require('../../Utilities/Extensions'),
    ColumnType = require('../../sync/ColumnType'),
    storeHelper = require('./storeHelper'),
    verror = require('verror'),
    typeConverter = require('./typeConverter');
function getSqliteType(columnType) {
  var sqliteType;
  switch (columnType) {
    case ColumnType.Object:
    case ColumnType.Array:
    case ColumnType.String:
    case ColumnType.Text:
      sqliteType = "TEXT";
      break;
    case ColumnType.Integer:
    case ColumnType.Int:
    case ColumnType.Boolean:
    case ColumnType.Bool:
    case ColumnType.Date:
      sqliteType = "INTEGER";
      break;
    case ColumnType.Real:
    case ColumnType.Float:
      sqliteType = "REAL";
      break;
    default:
      throw new Error('Column type ' + columnType + ' is not supported');
  }
  return sqliteType;
}
function isJSValueCompatibleWithColumnType(value, columnType) {
  if (_.isNull(value)) {
    return true;
  }
  switch (columnType) {
    case ColumnType.Object:
      return _.isObject(value);
    case ColumnType.Array:
      return _.isArray(value);
    case ColumnType.String:
    case ColumnType.Text:
      return true;
    case ColumnType.Boolean:
    case ColumnType.Bool:
    case ColumnType.Integer:
    case ColumnType.Int:
      return _.isBool(value) || _.isInteger(value);
    case ColumnType.Date:
      return _.isDate(value);
    case ColumnType.Real:
    case ColumnType.Float:
      return _.isNumber(value);
    default:
      return false;
  }
}
function isSqliteValueCompatibleWithColumnType(value, columnType) {
  if (_.isNull(value)) {
    return true;
  }
  switch (columnType) {
    case ColumnType.Object:
      return _.isString(value);
    case ColumnType.Array:
      return _.isString(value);
    case ColumnType.String:
    case ColumnType.Text:
      return _.isString(value);
    case ColumnType.Boolean:
    case ColumnType.Bool:
      return _.isInteger(value);
    case ColumnType.Integer:
    case ColumnType.Int:
      return _.isInteger(value);
    case ColumnType.Date:
      return _.isInteger(value);
    case ColumnType.Real:
    case ColumnType.Float:
      return _.isNumber(value);
    default:
      return false;
  }
}
function isColumnTypeValid(type) {
  for (var key in ColumnType) {
    if (ColumnType[key] === type) {
      return true;
    }
  }
  return false;
}
function serialize(value, columnDefinitions) {
  var serializedValue = {};
  try {
    Validate.notNull(columnDefinitions, 'columnDefinitions');
    Validate.isObject(columnDefinitions);
    Validate.notNull(value);
    Validate.isObject(value);
    for (var property in value) {
      var columnType = storeHelper.getColumnType(columnDefinitions, property);
      if (!_.isNull(columnType)) {
        serializedValue[property] = serializeMember(value[property], columnType);
      }
    }
  } catch (error) {
    throw new verror.VError(error, 'Failed to serialize value ' + JSON.stringify(value) + '. Column definitions: ' + JSON.stringify(columnDefinitions));
  }
  return serializedValue;
}
function deserialize(value, columnDefinitions) {
  var deserializedValue = {};
  try {
    Validate.notNull(columnDefinitions, 'columnDefinitions');
    Validate.isObject(columnDefinitions);
    Validate.notNull(value);
    Validate.isObject(value);
    for (var property in value) {
      var columnName = storeHelper.getColumnName(columnDefinitions, property);
      deserializedValue[columnName] = deserializeMember(value[property], storeHelper.getColumnType(columnDefinitions, property));
    }
  } catch (error) {
    throw new verror.VError(error, 'Failed to deserialize value ' + JSON.stringify(value) + '. Column definitions: ' + JSON.stringify(columnDefinitions));
  }
  return deserializedValue;
}
function serializeMember(value, columnType) {
  if (!isColumnTypeValid(columnType)) {
    throw new Error('Column type ' + columnType + ' is not supported');
  }
  if (!isJSValueCompatibleWithColumnType(value, columnType)) {
    throw new Error('Converting value ' + JSON.stringify(value) + ' of type ' + typeof value + ' to type ' + columnType + ' is not supported.');
  }
  var sqliteType = getSqliteType(columnType),
      serializedValue;
  switch (sqliteType) {
    case "TEXT":
      serializedValue = typeConverter.convertToText(value);
      break;
    case "INTEGER":
      serializedValue = typeConverter.convertToInteger(value);
      break;
    case "REAL":
      serializedValue = typeConverter.convertToReal(value);
      break;
    default:
      throw new Error('Column type ' + columnType + ' is not supported');
  }
  return serializedValue;
}
function deserializeMember(value, columnType) {
  if (!columnType) {
    return value;
  }
  if (!isColumnTypeValid(columnType)) {
    throw new Error('Column type ' + columnType + ' is not supported');
  }
  if (!isSqliteValueCompatibleWithColumnType(value, columnType)) {
    throw new Error('Converting value ' + JSON.stringify(value) + ' of type ' + typeof value + ' to type ' + columnType + ' is not supported.');
  }
  var deserializedValue,
      error;
  switch (columnType) {
    case ColumnType.Object:
      deserializedValue = typeConverter.convertToObject(value);
      break;
    case ColumnType.Array:
      deserializedValue = typeConverter.convertToArray(value);
      break;
    case ColumnType.String:
    case ColumnType.Text:
      deserializedValue = typeConverter.convertToText(value);
      break;
    case ColumnType.Integer:
    case ColumnType.Int:
      deserializedValue = typeConverter.convertToInteger(value);
      break;
    case ColumnType.Boolean:
    case ColumnType.Bool:
      deserializedValue = typeConverter.convertToBoolean(value);
      break;
    case ColumnType.Date:
      deserializedValue = typeConverter.convertToDate(value);
      break;
    case ColumnType.Real:
    case ColumnType.Float:
      deserializedValue = typeConverter.convertToReal(value);
      break;
    default:
      throw new Error(_.format(Platform.getResourceString("sqliteSerializer_UnsupportedColumnType"), columnType));
  }
  return deserializedValue;
}
function serializeValue(value) {
  var type;
  if (_.isNull(value)) {
    type = ColumnType.Object;
  } else if (_.isNumber(value)) {
    type = ColumnType.Real;
  } else if (_.isDate(value)) {
    type = ColumnType.Date;
  } else if (_.isBool(value)) {
    type = ColumnType.Boolean;
  } else if (_.isString(value)) {
    type = ColumnType.String;
  } else if (_.isArray(value)) {
    type = ColumnType.Array;
  } else if (_.isObject(value)) {
    type = ColumnType.Object;
  } else {
    type = ColumnType.Object;
  }
  return serializeMember(value, type);
}
exports.serialize = serialize;
exports.serializeValue = serializeValue;
exports.deserialize = deserialize;
exports.getSqliteType = getSqliteType;
