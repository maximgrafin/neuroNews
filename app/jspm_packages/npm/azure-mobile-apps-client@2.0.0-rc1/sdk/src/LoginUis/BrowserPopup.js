/* */ 
(function(process) {
  var PostMessageExchange = require('../Utilities/PostMessageExchange');
  exports.supportsCurrentRuntime = function() {
    return true;
  };
  exports.login = function(startUri, endUri, callback) {
    var completionOrigin = PostMessageExchange.getOriginRoot(window.location.href),
        runtimeOrigin = PostMessageExchange.getOriginRoot(startUri),
        useIntermediateIframe = window.navigator.userAgent.indexOf("MSIE") >= 0 || window.navigator.userAgent.indexOf("Trident") >= 0,
        intermediateIframe = useIntermediateIframe && createIntermediateIframeForLogin(runtimeOrigin, completionOrigin),
        completionType = useIntermediateIframe ? "iframe" : "postMessage";
    startUri += startUri.indexOf('?') == -1 ? '?' : '&';
    startUri += "completion_type=" + completionType + "&completion_origin=" + encodeURIComponent(completionOrigin);
    if (!(completionOrigin && (completionOrigin.indexOf("http:") === 0 || completionOrigin.indexOf("https:") === 0))) {
      var error = "Login is only supported from http:// or https:// URLs. Please host your page in a web server.";
      callback(error, null);
      return;
    }
    var loginWindow = window.open(startUri, "_blank", "location=no,resizable=yes"),
        complete = function(errorValue, oauthValue) {
          window.clearInterval(checkForWindowClosedInterval);
          loginWindow.close();
          if (window.removeEventListener) {
            window.removeEventListener("message", handlePostMessage);
          } else {
            window.detachEvent("onmessage", handlePostMessage);
          }
          if (intermediateIframe) {
            intermediateIframe.parentNode.removeChild(intermediateIframe);
          }
          callback(errorValue, oauthValue);
        },
        handlePostMessage = function(evt) {
          var expectedSource = useIntermediateIframe ? intermediateIframe.contentWindow : loginWindow;
          if (evt.source !== expectedSource) {
            return;
          }
          var envelope;
          try {
            if (typeof evt.data === 'string') {
              envelope = JSON.parse(evt.data);
            } else {
              envelope = evt.data;
            }
          } catch (ex) {
            return;
          }
          if (envelope && envelope.type === "LoginCompleted" && (envelope.oauth || envelope.error)) {
            complete(envelope.error, envelope.oauth);
          }
        },
        checkForWindowClosedInterval = window.setInterval(function() {
          if (loginWindow && loginWindow.closed === true) {
            complete(new Error("canceled"), null);
          }
        }, 250);
    if (window.addEventListener) {
      window.addEventListener("message", handlePostMessage, false);
    } else {
      window.attachEvent("onmessage", handlePostMessage);
    }
    return {cancelCallback: function() {
        complete(new Error("canceled"), null);
        return true;
      }};
  };
  function createIntermediateIframeForLogin(runtimeOrigin, completionOrigin) {
    var frame = document.createElement("iframe");
    frame.name = "zumo-login-receiver";
    frame.src = runtimeOrigin + "/.auth/login/iframereceiver?completion_origin=" + encodeURIComponent(completionOrigin);
    frame.setAttribute("width", 0);
    frame.setAttribute("height", 0);
    frame.style.display = "none";
    document.body.appendChild(frame);
    return frame;
  }
})(require('process'));
