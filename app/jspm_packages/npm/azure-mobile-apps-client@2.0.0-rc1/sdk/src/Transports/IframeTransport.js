/* */ 
var Promises = require('../Utilities/Promises'),
    PostMessageExchange = require('../Utilities/PostMessageExchange'),
    loadBridgeFramePromises = [],
    messageExchange = PostMessageExchange.instance;
exports.name = "../../Transports/IframeTransport";
exports.supportsCurrentRuntime = function() {
  return typeof global.postMessage !== "undefined";
};
exports.performRequest = function(request, callback) {
  var originRoot = PostMessageExchange.getOriginRoot(request.url);
  whenBridgeLoaded(originRoot, function(bridgeFrame) {
    var message = {
      type: request.type,
      url: request.url,
      headers: request.headers,
      data: request.data
    };
    messageExchange.request(bridgeFrame.contentWindow, message, originRoot).then(function(reply) {
      fixupAjax(reply);
      callback(null, reply);
    }, function(error) {
      callback(error, null);
    });
  });
};
function fixupAjax(xhr) {
  if (xhr) {
    if (xhr.status === 1223) {
      xhr.status = 204;
    }
  }
}
function whenBridgeLoaded(originRoot, callback) {
  var cacheEntry = loadBridgeFramePromises[originRoot];
  if (!cacheEntry) {
    cacheEntry = loadBridgeFramePromises[originRoot] = new Promises.Promise(function(complete, error) {
      var bridgeFrame = document.createElement("iframe"),
          callerOrigin = PostMessageExchange.getOriginRoot(window.location.href),
          handleBridgeLoaded = function() {
            complete(bridgeFrame);
          };
      if (bridgeFrame.addEventListener) {
        bridgeFrame.addEventListener("load", handleBridgeLoaded, false);
      } else {
        bridgeFrame.attachEvent("onload", handleBridgeLoaded);
      }
      bridgeFrame.src = originRoot + "/crossdomain/bridge?origin=" + encodeURIComponent(callerOrigin);
      bridgeFrame.setAttribute("width", 0);
      bridgeFrame.setAttribute("height", 0);
      bridgeFrame.style.display = "none";
      global.document.body.appendChild(bridgeFrame);
    });
  }
  cacheEntry.then(callback);
}
