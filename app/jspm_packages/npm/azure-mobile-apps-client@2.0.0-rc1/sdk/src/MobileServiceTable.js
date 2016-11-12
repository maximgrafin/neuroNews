/* */ 
var _ = require('./Utilities/Extensions');
var Validate = require('./Utilities/Validate');
var Platform = require('./Platform/index');
var Query = require('azure-query-js').Query;
var constants = require('./constants');
var tableHelper = require('./tableHelper');
var idPropertyName = "id";
var tableRouteSeperatorName = "tables";
var idNames = ["ID", "Id", "id", "iD"];
var nextLinkRegex = /^(.*?);\s*rel\s*=\s*(\w+)\s*$/;
var SystemProperties = {
  None: 0,
  CreatedAt: 1,
  UpdatedAt: 2,
  Version: 4,
  All: 0xFFFF
};
var MobileServiceSystemColumns = {
  CreatedAt: "createdAt",
  UpdatedAt: "updatedAt",
  Version: "version",
  Deleted: "deleted"
};
function MobileServiceTable(tableName, client) {
  this.getTableName = function() {
    return tableName;
  };
  this.getMobileServiceClient = function() {
    return client;
  };
  this._features = undefined;
}
MobileServiceTable.SystemProperties = SystemProperties;
MobileServiceTable.prototype._read = function(query, parameters, callback) {
  if (_.isNull(callback)) {
    if (_.isNull(parameters) && (typeof query === 'function')) {
      callback = query;
      query = null;
      parameters = null;
    } else if (typeof parameters === 'function') {
      callback = parameters;
      parameters = null;
      if (!_.isNull(query) && _.isObject(query)) {
        if (!_.isString(query) && _.isNull(query.toOData)) {
          parameters = query;
          query = null;
        }
      }
    }
  }
  if (query && _.isString(query)) {
    Validate.notNullOrEmpty(query, 'query');
  }
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters, 'parameters');
  }
  Validate.notNull(callback, 'callback');
  var tableName = this.getTableName();
  var queryString = null;
  var projection = null;
  var features = this._features || [];
  if (_.isString(query)) {
    queryString = query;
    if (!_.isNullOrEmpty(query)) {
      features.push(constants.features.TableReadRaw);
    }
  } else if (_.isObject(query) && !_.isNull(query.toOData)) {
    if (query.getComponents) {
      features.push(constants.features.TableReadQuery);
      var components = query.getComponents();
      projection = components.projection;
      if (components.table) {
        if (tableName !== components.table) {
          var message = _.format(Platform.getResourceString("MobileServiceTable_ReadMismatchedQueryTables"), tableName, components.table);
          callback(new Error(message), null);
          return;
        }
        var oDataQuery = query.toOData();
        queryString = oDataQuery.replace(new RegExp('^/' + components.table), '');
      }
    }
  }
  addQueryParametersFeaturesIfApplicable(features, parameters);
  if (!_.isNull(parameters)) {
    var userDefinedQueryString = _.url.getQueryString(parameters);
    if (!_.isNullOrEmpty(queryString)) {
      queryString += '&' + userDefinedQueryString;
    } else {
      queryString = userDefinedQueryString;
    }
  }
  var urlFragment = queryString;
  if (!_.url.isAbsoluteUrl(urlFragment)) {
    urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, tableName);
    if (!_.isNull(queryString)) {
      urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
    }
  }
  var headers = {};
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  this.getMobileServiceClient()._request('GET', urlFragment, null, false, headers, features, function(error, response) {
    var values = null;
    if (_.isNull(error)) {
      values = _.fromJson(response.responseText);
      if (values && !Array.isArray(values) && typeof values.count !== 'undefined' && typeof values.results !== 'undefined') {
        values.results.totalCount = values.count;
        values = values.results;
      }
      if (projection !== null) {
        var i = 0;
        for (i = 0; i < values.length; i++) {
          values[i] = projection.call(values[i]);
        }
      }
      if (Array.isArray(values) && response.getResponseHeader && _.isNull(values.nextLink)) {
        try {
          var link = response.getResponseHeader('Link');
          if (!_.isNullOrEmpty(link)) {
            var result = nextLinkRegex.exec(link);
            if (result && result.length === 3 && result[2] == 'next') {
              values.nextLink = result[1];
            }
          }
        } catch (ex) {}
      }
    }
    callback(error, values);
  });
};
MobileServiceTable.prototype.read = Platform.async(MobileServiceTable.prototype._read);
MobileServiceTable.prototype.insert = Platform.async(function(instance, parameters, callback) {
  if (_.isNull(callback) && (typeof parameters === 'function')) {
    callback = parameters;
    parameters = null;
  }
  Validate.notNull(instance, 'instance');
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters);
  }
  Validate.notNull(callback, 'callback');
  for (var i in idNames) {
    var id = instance[idNames[i]];
    if (!_.isNullOrZero(id)) {
      if (_.isString(id)) {
        if (idNames[i] !== idPropertyName) {
          throw new Error('Cannot insert if the ' + idPropertyName + ' member is already set.');
        } else {
          Validate.isValidId(id, idPropertyName);
        }
      } else {
        throw new Error('Cannot insert if the ' + idPropertyName + ' member is already set.');
      }
    }
  }
  var features = this._features || [];
  features = addQueryParametersFeaturesIfApplicable(features, parameters);
  var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName());
  if (!_.isNull(parameters)) {
    var queryString = _.url.getQueryString(parameters);
    urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
  }
  var headers = {};
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  this.getMobileServiceClient()._request('POST', urlFragment, instance, false, headers, features, function(error, response) {
    if (!_.isNull(error)) {
      callback(error, null);
    } else {
      var result = getItemFromResponse(response);
      result = Platform.allowPlatformToMutateOriginal(instance, result);
      callback(null, result);
    }
  });
});
MobileServiceTable.prototype.update = Platform.async(function(instance, parameters, callback) {
  var version,
      headers = {},
      features = this._features || [],
      serverInstance;
  if (_.isNull(callback) && (typeof parameters === 'function')) {
    callback = parameters;
    parameters = null;
  }
  Validate.notNull(instance, 'instance');
  Validate.isValidId(instance[idPropertyName], 'instance.' + idPropertyName);
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters, 'parameters');
  }
  Validate.notNull(callback, 'callback');
  version = instance[MobileServiceSystemColumns.Version];
  serverInstance = removeSystemProperties(instance);
  if (!_.isNullOrEmpty(version)) {
    headers['If-Match'] = getEtagFromVersion(version);
    features.push(constants.features.OptimisticConcurrency);
  }
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  features = addQueryParametersFeaturesIfApplicable(features, parameters);
  var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName(), encodeURIComponent(instance[idPropertyName].toString()));
  if (!_.isNull(parameters)) {
    var queryString = _.url.getQueryString(parameters);
    urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
  }
  this.getMobileServiceClient()._request('PATCH', urlFragment, serverInstance, false, headers, features, function(error, response) {
    if (!_.isNull(error)) {
      setServerItemIfPreconditionFailed(error);
      callback(error);
    } else {
      var result = getItemFromResponse(response);
      result = Platform.allowPlatformToMutateOriginal(instance, result);
      callback(null, result);
    }
  });
});
MobileServiceTable.prototype.refresh = Platform.async(function(instance, parameters, callback) {
  if (_.isNull(callback) && (typeof parameters === 'function')) {
    callback = parameters;
    parameters = null;
  }
  Validate.notNull(instance, 'instance');
  if (!_.isValidId(instance[idPropertyName], idPropertyName)) {
    if (typeof instance[idPropertyName] === 'string' && instance[idPropertyName] !== '') {
      throw new Error(idPropertyName + ' "' + instance[idPropertyName] + '" is not valid.');
    } else {
      callback(null, instance);
    }
    return;
  }
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters, 'parameters');
  }
  Validate.notNull(callback, 'callback');
  var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName());
  if (typeof instance[idPropertyName] === 'string') {
    var id = encodeURIComponent(instance[idPropertyName]).replace(/\'/g, '%27%27');
    urlFragment = _.url.combinePathAndQuery(urlFragment, "?$filter=id eq '" + id + "'");
  } else {
    urlFragment = _.url.combinePathAndQuery(urlFragment, "?$filter=id eq " + encodeURIComponent(instance[idPropertyName].toString()));
  }
  if (!_.isNull(parameters)) {
    var queryString = _.url.getQueryString(parameters);
    urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
  }
  var features = this._features || [];
  features.push(constants.features.TableRefreshCall);
  features = addQueryParametersFeaturesIfApplicable(features, parameters);
  var headers = {};
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  this.getMobileServiceClient()._request('GET', urlFragment, instance, false, headers, features, function(error, response) {
    if (!_.isNull(error)) {
      callback(error, null);
    } else {
      var result = _.fromJson(response.responseText);
      if (Array.isArray(result)) {
        result = result[0];
      }
      if (!result) {
        var message = _.format(Platform.getResourceString("MobileServiceTable_NotSingleObject"), idPropertyName);
        callback(new Error(message), null);
      }
      result = Platform.allowPlatformToMutateOriginal(instance, result);
      callback(null, result);
    }
  });
});
MobileServiceTable.prototype.lookup = Platform.async(function(id, parameters, callback) {
  if (_.isNull(callback) && (typeof parameters === 'function')) {
    callback = parameters;
    parameters = null;
  }
  Validate.isValidId(id, idPropertyName);
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters);
  }
  Validate.notNull(callback, 'callback');
  var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName(), encodeURIComponent(id.toString()));
  var features = this._features || [];
  features = addQueryParametersFeaturesIfApplicable(features, parameters);
  if (!_.isNull(parameters)) {
    var queryString = _.url.getQueryString(parameters);
    urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
  }
  var headers = {};
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  this.getMobileServiceClient()._request('GET', urlFragment, null, false, headers, features, function(error, response) {
    if (!_.isNull(error)) {
      callback(error, null);
    } else {
      var result = getItemFromResponse(response);
      callback(null, result);
    }
  });
});
MobileServiceTable.prototype.del = Platform.async(function(instance, parameters, callback) {
  if (_.isNull(callback) && (typeof parameters === 'function')) {
    callback = parameters;
    parameters = null;
  }
  Validate.notNull(instance, 'instance');
  Validate.isValidId(instance[idPropertyName], 'instance.' + idPropertyName);
  Validate.notNull(callback, 'callback');
  var headers = {};
  var features = this._features || [];
  if (_.isString(instance[idPropertyName])) {
    if (!_.isNullOrEmpty(instance[MobileServiceSystemColumns.Version])) {
      headers['If-Match'] = getEtagFromVersion(instance[MobileServiceSystemColumns.Version]);
      features.push(constants.features.OptimisticConcurrency);
    }
  }
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  features = addQueryParametersFeaturesIfApplicable(features, parameters);
  if (!_.isNull(parameters)) {
    Validate.isValidParametersObject(parameters);
  }
  var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName(), encodeURIComponent(instance[idPropertyName].toString()));
  if (!_.isNull(parameters)) {
    var queryString = _.url.getQueryString(parameters);
    urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
  }
  this.getMobileServiceClient()._request('DELETE', urlFragment, null, false, headers, features, function(error, response) {
    if (!_.isNull(error)) {
      setServerItemIfPreconditionFailed(error);
    }
    callback(error);
  });
});
tableHelper.defineQueryOperators(MobileServiceTable);
function removeSystemProperties(instance) {
  var copy = {};
  for (var property in instance) {
    if ((property != MobileServiceSystemColumns.Version) && (property != MobileServiceSystemColumns.UpdatedAt) && (property != MobileServiceSystemColumns.CreatedAt) && (property != MobileServiceSystemColumns.Deleted)) {
      copy[property] = instance[property];
    }
  }
  return copy;
}
function getItemFromResponse(response) {
  var result = _.fromJson(response.responseText);
  if (response.getResponseHeader) {
    var eTag = response.getResponseHeader('ETag');
    if (!_.isNullOrEmpty(eTag)) {
      result[MobileServiceSystemColumns.Version] = getVersionFromEtag(eTag);
    }
  }
  return result;
}
function setServerItemIfPreconditionFailed(error) {
  if (error.request && error.request.status === 412) {
    error.serverInstance = _.fromJson(error.request.responseText);
  }
}
function getEtagFromVersion(version) {
  var result = version.replace(/\"/g, '\\\"');
  return "\"" + result + "\"";
}
function getVersionFromEtag(etag) {
  var len = etag.length,
      result = etag;
  if (len > 1 && etag[0] === '"' && etag[len - 1] === '"') {
    result = etag.substr(1, len - 2);
  }
  return result.replace(/\\\"/g, '"');
}
function addQueryParametersFeaturesIfApplicable(features, userQueryParameters) {
  var hasQueryParameters = false;
  if (userQueryParameters) {
    if (Array.isArray(userQueryParameters)) {
      hasQueryParameters = userQueryParameters.length > 0;
    } else if (_.isObject(userQueryParameters)) {
      for (var k in userQueryParameters) {
        hasQueryParameters = true;
        break;
      }
    }
  }
  if (hasQueryParameters) {
    features.push(constants.features.AdditionalQueryParameters);
  }
  return features;
}
module.exports = MobileServiceTable;
