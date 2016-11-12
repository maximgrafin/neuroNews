/* */ 
var _ = require('./Extensions');
var Platform = require('../Platform/index');
exports.notNull = function(value, name) {
  if (_.isNull(value)) {
    throw _.format(Platform.getResourceString("Validate_NotNullError"), name || 'Value');
  }
};
exports.notNullOrEmpty = function(value, name) {
  if (_.isNullOrEmpty(value)) {
    throw _.format(Platform.getResourceString("Validate_NotNullOrEmptyError"), name || 'Value');
  }
};
exports.notNullOrZero = function(value, name) {
  if (_.isNullOrZero(value)) {
    throw _.format(Platform.getResourceString("Validate_NotNullOrEmptyError"), name || 'Value');
  }
};
exports.isValidId = function(value, name) {
  if (!_.isValidId(value)) {
    throw new Error((name || 'id') + ' "' + value + '" is not valid.');
  }
};
exports.isDate = function(value, name) {
  exports.notNull(value, name);
  if (!_.isDate(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'Date', typeof value);
  }
};
exports.isNumber = function(value, name) {
  exports.notNull(value, name);
  if (!_.isNumber(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'Number', typeof value);
  }
};
exports.isFunction = function(value, name) {
  if (!_.isFunction(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'Function', typeof value);
  }
};
exports.isValidParametersObject = function(value, name) {
  exports.notNull(value, name);
  exports.isObject(value, name);
  for (var parameter in value) {
    if (parameter.indexOf('$') === 0) {
      throw _.format(Platform.getResourceString("Validate_InvalidUserParameter"), name, parameter);
    }
  }
};
exports.isInteger = function(value, name) {
  exports.notNull(value, name);
  exports.isNumber(value, name);
  if (parseInt(value, 10) !== parseFloat(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'number', typeof value);
  }
};
exports.isBool = function(value, name) {
  if (!_.isBool(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'number', typeof value);
  }
};
exports.isString = function(value, name) {
  if (!_.isString(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'string', typeof value);
  }
};
exports.isObject = function(value, name) {
  if (!_.isObject(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'object', typeof value);
  }
};
exports.isArray = function(value, name) {
  if (!Array.isArray(value)) {
    throw _.format(Platform.getResourceString("TypeCheckError"), name || 'Value', 'array', typeof value);
  }
};
exports.length = function(value, length, name) {
  exports.notNull(value, name);
  exports.isInteger(length, 'length');
  if (value.length !== length) {
    throw _.format(Platform.getResourceString("Validate_LengthUnexpected"), name || 'Value', length, value.length);
  }
};
