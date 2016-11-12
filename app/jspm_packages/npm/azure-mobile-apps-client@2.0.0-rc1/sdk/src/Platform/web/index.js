/* */ 
(function(process) {
  var _ = require('../../Utilities/Extensions'),
      Validate = require('../../Utilities/Validate'),
      Promises = require('../../Utilities/Promises'),
      version = require('../../../../package.json!systemjs-json').version,
      resources = require('../../resources.json!systemjs-json'),
      environment = require('../environment'),
      inMemorySettingStore = {};
  try {
    var key = '___z';
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    inMemorySettingStore = localStorage;
  } catch (e) {}
  var bestAvailableTransport = null;
  var knownTransports = [require('../../Transports/DirectAjaxTransport'), require('../../Transports/IframeTransport')];
  var knownLoginUis = [require('../../LoginUis/WebAuthBroker'), require('../../LoginUis/CordovaPopup'), require('../../LoginUis/BrowserPopup')];
  var isoDateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d*))?Z$/;
  var dateSerializerOmitsDecimals = !JSON.stringify(new Date(100)).match(/\.100Z"$/);
  exports.async = function async(func) {
    return function() {
      var that = this;
      var args = arguments;
      return new Promises.Promise(function(complete, error) {
        var callback = function(err) {
          if (_.isNull(err)) {
            complete.apply(null, Array.prototype.slice.call(arguments, 1));
          } else {
            error(err);
          }
        };
        Array.prototype.push.call(args, callback);
        try {
          func.apply(that, args);
        } catch (ex) {
          callback(_.createError(ex));
        }
      });
    };
  };
  exports.readSetting = function readSetting(name) {
    return inMemorySettingStore[name];
  };
  exports.writeSetting = function writeSetting(name, value) {
    inMemorySettingStore[name] = value;
  };
  exports.webRequest = function(request, callback) {
    return getBestTransport().performRequest(request, callback);
  };
  exports.getUserAgent = function() {
    return null;
  };
  exports.getOperatingSystemInfo = function() {
    return {
      name: "--",
      version: "--",
      architecture: "--"
    };
  };
  exports.getSdkInfo = function() {
    return {
      language: environment.getTarget(),
      fileVersion: version
    };
  };
  exports.login = function(startUri, endUri, callback) {
    var findProtocol = /^[a-z]+:/,
        requiredProtocol = 'https:';
    startUri = startUri.replace(findProtocol, requiredProtocol);
    if (endUri) {
      endUri = endUri.replace(findProtocol, requiredProtocol);
    }
    return getBestProvider(knownLoginUis).login(startUri, endUri, callback);
  };
  exports.toJson = function(value) {
    return JSON.stringify(value, function(key, stringifiedValue) {
      if (dateSerializerOmitsDecimals && this && _.isDate(this[key])) {
        var msec = this[key].getMilliseconds(),
            msecString = String(msec + 1000).substring(1);
        return stringifiedValue.replace(isoDateRegex, function(all, datetime) {
          return datetime + "." + msecString + "Z";
        });
      } else {
        return stringifiedValue;
      }
    });
  };
  exports.tryParseIsoDateString = function(text) {
    Validate.isString(text);
    var matchedDate = isoDateRegex.exec(text);
    if (matchedDate) {
      var dateWithoutFraction = matchedDate[1],
          fraction = matchedDate[2] || "0",
          milliseconds = Math.round(1000 * Number("0." + fraction));
      dateWithoutFraction = dateWithoutFraction.replace(/\-/g, "/").replace("T", " ");
      var ticks = Date.parse(dateWithoutFraction + " UTC");
      if (!isNaN(ticks)) {
        return new Date(ticks + milliseconds);
      }
    }
    return null;
  };
  exports.getResourceString = function(resourceName) {
    return resources[resourceName];
  };
  exports.allowPlatformToMutateOriginal = function(original, updated) {
    return updated;
  };
  function getBestTransport() {
    if (!bestAvailableTransport) {
      bestAvailableTransport = getBestProvider(knownTransports);
    }
    return bestAvailableTransport;
  }
  function getBestProvider(providers) {
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].supportsCurrentRuntime()) {
        return providers[i];
      }
    }
    throw new Error("Unsupported browser - no suitable providers are available.");
  }
})(require('process'));
