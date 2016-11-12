/* */ 
(function(process) {
  var Validate = require('./Validate');
  var Platform = require('../Platform/index');
  var _ = exports;
  exports.isNull = function(value) {
    return value === null || value === undefined;
  };
  exports.isNullOrZero = function(value) {
    return value === null || value === undefined || value === 0 || value === '';
  };
  exports.isNullOrEmpty = function(value) {
    return _.isNull(value) || value.length === 0;
  };
  exports.format = function(message) {
    Validate.isString(message, 'message');
    if (!_.isNullOrEmpty(message) && arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        var pattern = '{' + (i - 1) + '}';
        while (message.indexOf(pattern) !== -1) {
          message = message.replace(pattern, arguments[i]);
        }
      }
    }
    return message;
  };
  exports.has = function(value, key) {
    Validate.notNull(key, 'key');
    Validate.isString(key, 'key');
    return !_.isNull(value) && value.hasOwnProperty(key);
  };
  exports.hasProperty = function(object, properties) {
    for (var i = 0; i < properties.length; i++) {
      if (_.has(object, properties[i])) {
        return true;
      }
    }
    return false;
  };
  exports.extend = function extend(target, members) {
    for (var member in members) {
      if (members.hasOwnProperty(member)) {
        target[member] = members[member];
      }
    }
    return target;
  };
  exports.isObject = function(value) {
    return _.isNull(value) || (typeof value === 'object' && !_.isDate(value));
  };
  exports.isValidId = function(value) {
    if (_.isNullOrZero(value)) {
      return false;
    }
    if (_.isString(value)) {
      if (value.length === 0 || value.length > 255 || value.trim().length === 0) {
        return false;
      }
      var ex = /[+"\/?`\\]|[\u0000-\u001F]|[\u007F-\u009F]|^\.{1,2}$/;
      if (value.match(ex) !== null) {
        return false;
      }
      return true;
    } else if (_.isNumber(value)) {
      return value > 0;
    }
    return false;
  };
  exports.isString = function(value) {
    return _.isNull(value) || (typeof value === 'string');
  };
  exports.isNumber = function(value) {
    return !_.isNull(value) && (typeof value === 'number');
  };
  exports.isInteger = function(value) {
    return _.isNumber(value) && (parseInt(value, 10) === parseFloat(value));
  };
  exports.isBool = function(value) {
    return !_.isNull(value) && (typeof value == 'boolean');
  };
  exports.isFunction = function(value) {
    return typeof value == 'function';
  };
  exports.isArray = function(value) {
    return !_.isNull(value) && (value.constructor === Array);
  };
  function classOf(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  }
  exports.isDate = function(value) {
    return !_.isNull(value) && (classOf(value) == 'date');
  };
  exports.toJson = function(value) {
    return Platform.toJson(value);
  };
  exports.fromJson = function(value) {
    var jsonValue = null;
    if (!_.isNullOrEmpty(value)) {
      jsonValue = JSON.parse(value, function(k, v) {
        if (_.isString(v) && !_.isNullOrEmpty(v)) {
          var date = exports.tryParseIsoDateString(v);
          if (!_.isNull(date)) {
            return date;
          }
        }
        return v;
      });
    }
    return jsonValue;
  };
  exports.createUniqueInstallationId = function() {
    var pad4 = function(str) {
      return "0000".substring(str.length) + str;
    };
    var hex4 = function() {
      return pad4(Math.floor(Math.random() * 0x10000).toString(16));
    };
    return (hex4() + hex4() + "-" + hex4() + "-" + hex4() + "-" + hex4() + "-" + hex4() + hex4() + hex4());
  };
  exports.mapProperties = function(instance, action) {
    var results = [];
    if (!_.isNull(instance)) {
      var key = null;
      for (key in instance) {
        results.push(action(key, instance[key]));
      }
    }
    return results;
  };
  exports.pad = function(value, length, ch) {
    Validate.notNull(value, 'value');
    Validate.isInteger(length, 'length');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty(ch, 'ch');
    Validate.length(ch, 1, 'ch');
    var text = value.toString();
    while (text.length < length) {
      text = ch + text;
    }
    return text;
  };
  exports.trimEnd = function(text, ch) {
    Validate.isString(text, 'text');
    Validate.notNull(text, 'text');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty('ch', 'ch');
    Validate.length(ch, 1, 'ch');
    var end = text.length - 1;
    while (end >= 0 && text[end] === ch) {
      end--;
    }
    return end >= 0 ? text.substr(0, end + 1) : '';
  };
  exports.trimStart = function(text, ch) {
    Validate.isString(text, 'text');
    Validate.notNull(text, 'text');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty(ch, 'ch');
    Validate.length(ch, 1, 'ch');
    var start = 0;
    while (start < text.length && text[start] === ch) {
      start++;
    }
    return start < text.length ? text.substr(start, text.length - start) : '';
  };
  exports.compareCaseInsensitive = function(first, second) {
    if (_.isString(first) && !_.isNullOrEmpty(first)) {
      first = first.toUpperCase();
    }
    if (_.isString(first) && !_.isNullOrEmpty(second)) {
      second = second.toUpperCase();
    }
    return first === second;
  };
  exports.url = {
    separator: '/',
    combinePathSegments: function() {
      var segments = [];
      var i = 0;
      Validate.notNullOrEmpty(arguments, 'arguments');
      for (i = 0; i < arguments.length; i++) {
        var segment = arguments[i];
        Validate.isString(segment, _.format('argument[{0}]', i));
        if (i !== 0) {
          segment = _.trimStart(segment || '', _.url.separator);
        }
        if (i < arguments.length - 1) {
          segment = _.trimEnd(segment || '', _.url.separator);
        }
        segments.push(segment);
      }
      return segments.reduce(function(a, b) {
        return a + _.url.separator + b;
      });
    },
    getQueryString: function(parameters) {
      Validate.notNull(parameters, 'parameters');
      Validate.isObject(parameters, 'parameters');
      var pairs = [];
      for (var parameter in parameters) {
        var value = parameters[parameter];
        if (exports.isObject(value)) {
          value = exports.toJson(value);
        }
        pairs.push(encodeURIComponent(parameter) + "=" + encodeURIComponent(value));
      }
      return pairs.join("&");
    },
    combinePathAndQuery: function(path, queryString) {
      Validate.notNullOrEmpty(path, 'path');
      Validate.isString(path, 'path');
      if (_.isNullOrEmpty(queryString)) {
        return path;
      }
      Validate.isString(queryString, 'queryString');
      if (path.indexOf('?') >= 0) {
        return path + '&' + exports.trimStart(queryString, '?');
      } else {
        return path + '?' + exports.trimStart(queryString, '?');
      }
    },
    isAbsoluteUrl: function(url) {
      if (_.isNullOrEmpty(url)) {
        return false;
      }
      var start = url.substring(0, 7).toLowerCase();
      return (start == "http://" || start == "https:/");
    },
    isHttps: function(url) {
      if (_.isNullOrEmpty(url)) {
        return false;
      }
      var start = url.substring(0, 7).toLowerCase();
      return (start == "https:/");
    }
  };
  exports.tryParseIsoDateString = function(text) {
    return Platform.tryParseIsoDateString(text);
  };
  exports.createError = function(exceptionOrMessage, request) {
    var error;
    if (request) {
      var message = Platform.getResourceString("Extensions_DefaultErrorMessage");
      if (request.status === 0) {
        message = Platform.getResourceString("Extensions_ConnectionFailureMessage");
      } else {
        var isText = false;
        if (request.getResponseHeader) {
          var contentType = request.getResponseHeader('Content-Type');
          if (contentType) {
            isText = contentType.toLowerCase().indexOf("text") >= 0;
          }
        }
        try {
          var response = JSON.parse(request.responseText);
          if (typeof response === 'string') {
            message = response;
          } else {
            message = response.error || response.description || request.statusText || Platform.getResourceString("Extensions_DefaultErrorMessage");
          }
        } catch (ex) {
          if (isText) {
            message = request.responseText;
          } else {
            message = request.statusText || Platform.getResourceString("Extensions_DefaultErrorMessage");
          }
        }
      }
      error = new Error(message);
      error.request = request;
    } else if (_.isString(exceptionOrMessage) && !_.isNullOrEmpty(exceptionOrMessage)) {
      error = new Error(exceptionOrMessage);
    } else if (exceptionOrMessage instanceof Error) {
      error = exceptionOrMessage;
    } else if (!_.isNull(exceptionOrMessage)) {
      error = new Error(Platform.getResourceString("Extensions_DefaultErrorMessage"));
      error.exception = exceptionOrMessage;
    }
    return error;
  };
})(require('process'));
