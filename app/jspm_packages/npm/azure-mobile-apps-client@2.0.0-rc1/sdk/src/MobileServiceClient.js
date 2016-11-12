/* */ 
(function(process) {
  var _ = require('./Utilities/Extensions'),
      constants = require('./constants'),
      Validate = require('./Utilities/Validate'),
      Platform = require('./Platform/index'),
      MobileServiceSyncContext = require('./sync/MobileServiceSyncContext'),
      MobileServiceSyncTable = require('./sync/MobileServiceSyncTable').MobileServiceSyncTable,
      MobileServiceTable = require('./MobileServiceTable'),
      MobileServiceLogin = require('./MobileServiceLogin');
  var Push;
  try {
    Push = require('./Push/Push').Push;
  } catch (e) {}
  var _alternateLoginHost = null;
  Object.defineProperties(MobileServiceClient.prototype, {alternateLoginHost: {
      get: function() {
        return this._alternateLoginHost;
      },
      set: function(value) {
        if (_.isNullOrEmpty(value)) {
          this._alternateLoginHost = this.applicationUrl;
        } else if (_.url.isAbsoluteUrl(value) && _.url.isHttps(value)) {
          this._alternateLoginHost = value;
        } else {
          throw new Error(value + ' is not valid. Expected Absolute Url with https scheme');
        }
      }
    }});
  var _loginUriPrefix = null;
  Object.defineProperties(MobileServiceClient.prototype, {loginUriPrefix: {
      get: function() {
        return this._loginUriPrefix;
      },
      set: function(value) {
        if (_.isNullOrEmpty(value)) {
          this._loginUriPrefix = ".auth/login";
        } else {
          _.isString(value);
          this._loginUriPrefix = value;
        }
      }
    }});
  function MobileServiceClient(applicationUrl) {
    Validate.isString(applicationUrl, 'applicationUrl');
    Validate.notNullOrEmpty(applicationUrl, 'applicationUrl');
    this.applicationUrl = applicationUrl;
    var sdkInfo = Platform.getSdkInfo();
    var osInfo = Platform.getOperatingSystemInfo();
    var sdkVersion = sdkInfo.fileVersion.split(".").slice(0, 2).join(".");
    this.version = "ZUMO/" + sdkVersion + " (lang=" + sdkInfo.language + "; " + "os=" + osInfo.name + "; " + "os_version=" + osInfo.version + "; " + "arch=" + osInfo.architecture + "; " + "version=" + sdkInfo.fileVersion + ")";
    this.currentUser = null;
    this._serviceFilter = null;
    this._login = new MobileServiceLogin(this);
    var _syncContext = new MobileServiceSyncContext(this);
    this.getSyncContext = function() {
      return _syncContext;
    };
    this.getTable = function(tableName) {
      Validate.isString(tableName, 'tableName');
      Validate.notNullOrEmpty(tableName, 'tableName');
      return new MobileServiceTable(tableName, this);
    };
    this.getSyncTable = function(tableName) {
      Validate.isString(tableName, 'tableName');
      Validate.notNullOrEmpty(tableName, 'tableName');
      return new MobileServiceSyncTable(tableName, this);
    };
    if (Push) {
      this.push = new Push(this, MobileServiceClient._applicationInstallationId);
    }
  }
  MobileServiceClient.prototype.withFilter = function(serviceFilter) {
    Validate.notNull(serviceFilter, 'serviceFilter');
    var client = new MobileServiceClient(this.applicationUrl);
    client.currentUser = this.currentUser;
    var existingFilter = this._serviceFilter;
    client._serviceFilter = _.isNull(existingFilter) ? serviceFilter : function(req, next, callback) {
      var composed = function(req, callback) {
        existingFilter(req, next, callback);
      };
      serviceFilter(req, composed, callback);
    };
    return client;
  };
  MobileServiceClient.prototype._request = function(method, uriFragment, content, ignoreFilters, headers, features, callback) {
    if (_.isNull(callback) && (typeof features === 'function')) {
      callback = features;
      features = null;
    }
    if (_.isNull(callback) && (typeof headers === 'function')) {
      callback = headers;
      headers = null;
    }
    if (_.isNull(callback) && (typeof ignoreFilters === 'function')) {
      callback = ignoreFilters;
      ignoreFilters = false;
    }
    if (_.isNull(callback) && (typeof content === 'function')) {
      callback = content;
      content = null;
    }
    Validate.isString(method, 'method');
    Validate.notNullOrEmpty(method, 'method');
    Validate.isString(uriFragment, 'uriFragment');
    Validate.notNull(uriFragment, 'uriFragment');
    Validate.notNull(callback, 'callback');
    var options = {type: method.toUpperCase()};
    if (_.url.isAbsoluteUrl(uriFragment)) {
      options.url = uriFragment;
    } else {
      options.url = _.url.combinePathSegments(this.applicationUrl, uriFragment);
    }
    options.headers = {};
    if (!_.isNull(headers)) {
      _.extend(options.headers, headers);
    }
    options.headers["X-ZUMO-INSTALLATION-ID"] = MobileServiceClient._applicationInstallationId;
    if (this.currentUser && !_.isNullOrEmpty(this.currentUser.mobileServiceAuthenticationToken)) {
      options.headers["X-ZUMO-AUTH"] = this.currentUser.mobileServiceAuthenticationToken;
    }
    if (!_.isNull(MobileServiceClient._userAgent)) {
      options.headers["User-Agent"] = MobileServiceClient._userAgent;
    }
    if (!_.isNullOrEmpty["X-ZUMO-VERSION"]) {
      options.headers["X-ZUMO-VERSION"] = this.version;
    }
    if (_.isNull(options.headers[constants.featuresHeaderName]) && features && features.length) {
      options.headers[constants.featuresHeaderName] = features.join(',');
    }
    if (!_.isNull(content)) {
      if (!_.isString(content)) {
        options.data = _.toJson(content);
      } else {
        options.data = content;
      }
      if (!_.hasProperty(options.headers, ['Content-Type', 'content-type', 'CONTENT-TYPE', 'Content-type'])) {
        options.headers['Content-Type'] = 'application/json';
      }
    } else {
      options.data = null;
    }
    var handler = function(error, response) {
      if (!_.isNull(error)) {
        error = _.createError(error);
      } else if (!_.isNull(response) && (response.status >= 400 || response.status === 0)) {
        error = _.createError(null, response);
        response = null;
      }
      callback(error, response);
    };
    if (!_.isNull(this._serviceFilter) && !ignoreFilters) {
      this._serviceFilter(options, Platform.webRequest, handler);
    } else {
      Platform.webRequest(options, handler);
    }
  };
  MobileServiceClient.prototype.loginWithOptions = Platform.async(function(provider, options, callback) {
    this._login.loginWithOptions(provider, options, callback);
  });
  MobileServiceClient.prototype.login = Platform.async(function(provider, token, useSingleSignOn, callback) {
    this._login.login(provider, token, useSingleSignOn, callback);
  });
  MobileServiceClient.prototype.logout = Platform.async(function(callback) {
    this.currentUser = null;
    callback();
  });
  MobileServiceClient.prototype.invokeApi = Platform.async(function(apiName, options, callback) {
    Validate.isString(apiName, 'apiName');
    if (_.isNull(callback)) {
      if (typeof options === 'function') {
        callback = options;
        options = null;
      }
    }
    Validate.notNull(callback, 'callback');
    var parameters,
        method,
        body,
        headers;
    if (!_.isNull(options)) {
      parameters = options.parameters;
      if (!_.isNull(parameters)) {
        Validate.isValidParametersObject(options.parameters);
      }
      method = options.method;
      body = options.body;
      headers = options.headers;
    }
    headers = headers || {};
    if (_.isNull(method)) {
      method = "POST";
    }
    if (_.isNull(headers.accept)) {
      headers.accept = 'application/json';
    }
    if (_.isNull(headers[constants.apiVersionHeaderName])) {
      headers[constants.apiVersionHeaderName] = constants.apiVersion;
    }
    var url;
    if (_.url.isAbsoluteUrl(apiName)) {
      url = apiName;
    } else {
      url = _.url.combinePathSegments("api", apiName);
    }
    if (!_.isNull(parameters)) {
      var queryString = _.url.getQueryString(parameters);
      url = _.url.combinePathAndQuery(url, queryString);
    }
    var features = [];
    if (!_.isNullOrEmpty(body)) {
      features.push(_.isString(body) ? constants.features.GenericApiCall : constants.features.JsonApiCall);
    }
    if (!_.isNull(parameters)) {
      features.push(constants.features.AdditionalQueryParameters);
    }
    this._request(method, url, body, null, headers, features, function(error, response) {
      if (!_.isNull(error)) {
        callback(error, null);
      } else {
        var contentType;
        if (typeof response.getResponseHeader !== 'undefined') {
          contentType = response.getResponseHeader('Content-Type');
        }
        if (!contentType) {
          try {
            response.result = _.fromJson(response.responseText);
          } catch (e) {}
        } else if (contentType.toLowerCase().indexOf('json') !== -1) {
          response.result = _.fromJson(response.responseText);
        }
        callback(null, response);
      }
    });
  });
  function getApplicationInstallationId() {
    var applicationInstallationId = null;
    var path = "MobileServices.Installation.config";
    var contents = Platform.readSetting(path);
    if (!_.isNull(contents)) {
      try {
        var config = _.fromJson(contents);
        applicationInstallationId = config.applicationInstallationId;
      } catch (ex) {}
    }
    if (_.isNullOrEmpty(applicationInstallationId)) {
      applicationInstallationId = _.createUniqueInstallationId();
      var configText = _.toJson({applicationInstallationId: applicationInstallationId});
      Platform.writeSetting(path, configText);
    }
    return applicationInstallationId;
  }
  MobileServiceClient._applicationInstallationId = getApplicationInstallationId();
  MobileServiceClient._userAgent = Platform.getUserAgent();
  module.exports = MobileServiceClient;
})(require('process'));
