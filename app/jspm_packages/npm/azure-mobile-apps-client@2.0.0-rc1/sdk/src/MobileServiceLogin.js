/* */ 
(function(process) {
  var _ = require('./Utilities/Extensions');
  var Validate = require('./Utilities/Validate');
  var Platform = require('./Platform/index');
  var loginUrl = ".auth/login";
  var loginDone = "done";
  var sessionModeKey = 'session_mode';
  var sessionModeValueToken = 'token';
  function MobileServiceLogin(client, ignoreFilters) {
    if (_.isNull(ignoreFilters)) {
      ignoreFilters = true;
    }
    Validate.notNull(client);
    Validate.isObject(client, 'client');
    this._loginState = {
      inProcess: false,
      cancelCallback: null
    };
    this.ignoreFilters = ignoreFilters;
    this.getMobileServiceClient = function() {
      return client;
    };
    this.getLoginInProcess = function() {
      return this._loginState.inProcess;
    };
  }
  MobileServiceLogin.prototype.loginWithOptions = function(provider, options, callback) {
    Validate.isString(provider, 'provider');
    Validate.notNull(provider, 'provider');
    if (_.isNull(callback)) {
      if (!_.isNull(options) && typeof options === 'function') {
        callback = options;
        options = null;
      } else {
        Validate.notNull(null, 'callback');
      }
    }
    if (!options && this._isAuthToken(provider)) {
      this.loginWithMobileServiceToken(provider, callback);
    } else {
      options = options || {};
      this.loginWithProvider(provider, options.token, options.useSingleSignOn, options.parameters, callback);
    }
  };
  MobileServiceLogin.prototype.login = function(provider, token, useSingleSignOn, callback) {
    if (_.isNull(callback)) {
      if (!_.isNull(useSingleSignOn) && (typeof useSingleSignOn === 'function')) {
        callback = useSingleSignOn;
        useSingleSignOn = null;
      } else if (!_.isNull(token) && (typeof token === 'function')) {
        callback = token;
        useSingleSignOn = null;
        token = null;
      }
    }
    if (_.isNull(useSingleSignOn)) {
      if (_.isBool(token)) {
        useSingleSignOn = token;
        token = null;
      } else {
        useSingleSignOn = false;
      }
    }
    if (_.isNull(token) && this._isAuthToken(provider)) {
      token = provider;
      provider = null;
    }
    if (_.isNull(provider)) {
      Validate.notNull(token);
      Validate.isString(token);
    }
    if (_.isNull(token)) {
      Validate.notNull(provider);
      Validate.isString(provider);
      provider = provider.toLowerCase();
    }
    if (!_.isNull(provider)) {
      if (provider.toLowerCase() === 'windowsazureactivedirectory') {
        provider = 'aad';
      }
      this.loginWithProvider(provider, token, useSingleSignOn, {}, callback);
    } else {
      this.loginWithMobileServiceToken(token, callback);
    }
  };
  MobileServiceLogin.prototype._isAuthToken = function(value) {
    return value && _.isString(value) && value.split('.').length === 3;
  };
  MobileServiceLogin.prototype.loginWithMobileServiceToken = function(authenticationToken, callback) {
    var self = this;
    var client = self.getMobileServiceClient();
    Validate.isString(authenticationToken, 'authenticationToken');
    Validate.notNullOrEmpty(authenticationToken, 'authenticationToken');
    client._request('POST', loginUrl, {authenticationToken: authenticationToken}, self.ignoreFilters, function(error, response) {
      onLoginResponse(error, response, client, callback);
    });
  };
  MobileServiceLogin.prototype.loginWithProvider = function(provider, token, useSingleSignOn, parameters, callback) {
    Validate.isString(provider, 'provider');
    if (!_.isNull(token)) {
      Validate.isObject(token, 'token');
    }
    if (this._loginState.inProcess) {
      var didCancel = this._loginState.cancelCallback && this._loginState.cancelCallback();
      if (!didCancel) {
        throw new Error('Cannot start a login operation because login is already in progress.');
      }
    }
    provider = provider.toLowerCase();
    if (!_.isNull(token)) {
      loginWithProviderAndToken(this, provider, token, parameters, callback);
    } else {
      loginWithLoginControl(this, provider, useSingleSignOn, parameters, callback);
    }
  };
  function onLoginComplete(error, token, client, callback) {
    var user = null;
    if (_.isNull(error)) {
      if (_.isNull(token) || !_.isObject(token) || !_.isObject(token.user) || !_.isString(token.authenticationToken)) {
        error = Platform.getResourceString("MobileServiceLogin_InvalidResponseFormat");
      } else {
        client.currentUser = token.user;
        client.currentUser.mobileServiceAuthenticationToken = token.authenticationToken;
        user = client.currentUser;
      }
    }
    if (!_.isNull(callback)) {
      callback(error, user);
    }
  }
  function onLoginResponse(error, response, client, callback) {
    var mobileServiceToken = null;
    if (_.isNull(error)) {
      try {
        mobileServiceToken = _.fromJson(response.responseText);
      } catch (e) {
        error = e;
      }
    }
    onLoginComplete(error, mobileServiceToken, client, callback);
  }
  function loginWithProviderAndToken(login, provider, token, parameters, callback) {
    var client = login.getMobileServiceClient();
    login._loginState = {
      inProcess: true,
      cancelCallback: null
    };
    var url = _.url.combinePathSegments(client.alternateLoginHost || client.applicationUrl, client.loginUriPrefix || loginUrl, provider);
    if (!_.isNull(parameters)) {
      var queryString = _.url.getQueryString(parameters);
      url = _.url.combinePathAndQuery(url, queryString);
    }
    client._request('POST', url, token, login.ignoreFilters, function(error, response) {
      login._loginState = {
        inProcess: false,
        cancelCallback: null
      };
      onLoginResponse(error, response, client, callback);
    });
  }
  function loginWithLoginControl(login, provider, useSingleSignOn, parameters, callback) {
    var client = login.getMobileServiceClient();
    var startUri = _.url.combinePathSegments(client.alternateLoginHost || client.applicationUrl, client.loginUriPrefix || loginUrl, provider);
    var endUri = null,
        queryParams = {},
        key;
    for (key in parameters) {
      queryParams[key] = parameters[key];
    }
    queryParams[sessionModeKey] = sessionModeValueToken;
    var queryString = _.url.getQueryString(queryParams);
    startUri = _.url.combinePathAndQuery(startUri, queryString);
    if (!useSingleSignOn) {
      endUri = _.url.combinePathSegments(client.alternateLoginHost || client.applicationUrl, client.loginUriPrefix || loginUrl, loginDone);
    }
    login._loginState = {
      inProcess: true,
      cancelCallback: null
    };
    var platformResult = Platform.login(startUri, endUri, function(error, mobileServiceToken) {
      login._loginState = {
        inProcess: false,
        cancelCallback: null
      };
      onLoginComplete(error, mobileServiceToken, client, callback);
    });
    if (login._loginState.inProcess && platformResult && platformResult.cancelCallback) {
      login._loginState.cancelCallback = platformResult.cancelCallback;
    }
  }
  module.exports = MobileServiceLogin;
})(require('process'));
