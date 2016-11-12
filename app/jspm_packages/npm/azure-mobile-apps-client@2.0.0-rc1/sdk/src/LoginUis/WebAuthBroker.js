/* */ 
var _ = require('../Utilities/Extensions'),
    easyAuthRedirectUriKey = 'post_login_redirect_url';
exports.supportsCurrentRuntime = function() {
  return isWebAuthBrokerAvailable();
};
exports.login = function(startUri, endUri, callback) {
  var windowsWebAuthBroker = Windows.Security.Authentication.Web.WebAuthenticationBroker;
  var noneWebAuthOptions = Windows.Security.Authentication.Web.WebAuthenticationOptions.none;
  var successWebAuthStatus = Windows.Security.Authentication.Web.WebAuthenticationStatus.success;
  var activationKindWebAuthContinuation = Windows.ApplicationModel.Activation.ActivationKind.webAuthenticationBrokerContinuation;
  var webAuthBrokerSuccessCallback = null;
  var webAuthBrokerErrorCallback = null;
  var webAuthBrokerContinuationCallback = null;
  webAuthBrokerSuccessCallback = function(result) {
    var error = null;
    var token = null;
    if (result.responseStatus !== successWebAuthStatus) {
      error = result;
    } else {
      var callbackEndUri = result.responseData;
      var tokenAsJson = null;
      var i = callbackEndUri.indexOf('#token=');
      if (i > 0) {
        tokenAsJson = decodeURIComponent(callbackEndUri.substring(i + 7));
      } else {
        i = callbackEndUri.indexOf('#error=');
        if (i > 0) {
          error = new Error(decodeURIComponent(callbackEndUri.substring(i + 7)));
        }
      }
      if (tokenAsJson !== null) {
        try {
          token = JSON.parse(tokenAsJson);
        } catch (e) {
          error = e;
        }
      }
    }
    callback(error, token);
  };
  webAuthBrokerErrorCallback = function(error) {
    callback(error, null);
  };
  webAuthBrokerContinuationCallback = function(activationArgs) {
    if (activationArgs.detail.kind === activationKindWebAuthContinuation) {
      var result = activationArgs.detail.webAuthenticationResult;
      if (result.responseStatus == successWebAuthStatus) {
        webAuthBrokerSuccessCallback(result);
      } else {
        webAuthBrokerErrorCallback(result);
      }
      WinJS.Application.removeEventListener('activated', webAuthBrokerContinuationCallback);
    }
  };
  if (endUri) {
    endUri = new Windows.Foundation.Uri(endUri);
  } else {
    var ssoQueryParameter = {},
        redirectUri = windowsWebAuthBroker.getCurrentApplicationCallbackUri().absoluteUri;
    ssoQueryParameter[easyAuthRedirectUriKey] = redirectUri;
    startUri = _.url.combinePathAndQuery(startUri, _.url.getQueryString(ssoQueryParameter));
  }
  startUri = new Windows.Foundation.Uri(startUri);
  var isLoginWindowLaunched;
  try {
    WinJS.Application.addEventListener('activated', webAuthBrokerContinuationCallback, true);
    windowsWebAuthBroker.authenticateAndContinue(startUri, endUri);
    isLoginWindowLaunched = true;
  } catch (ex) {
    WinJS.Application.removeEventListener('activated', webAuthBrokerContinuationCallback);
  }
  if (!isLoginWindowLaunched) {
    windowsWebAuthBroker.authenticateAsync(noneWebAuthOptions, startUri, endUri).done(webAuthBrokerSuccessCallback, webAuthBrokerErrorCallback);
  }
};
function isWebAuthBrokerAvailable() {
  return !!(window.Windows && window.Windows.Security && window.Windows.Security.Authentication && window.Windows.Security.Authentication.Web && window.Windows.Security.Authentication.Web.WebAuthenticationBroker);
}
