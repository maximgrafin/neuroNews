/* */ 
var Promises = require('./Promises'),
    messageTimeoutDuration = 5 * 60 * 1000;
function PostMessageExchange() {
  var self = this;
  self._lastMessageId = 0;
  self._hasListener = false;
  self._pendingMessages = {};
}
PostMessageExchange.prototype.request = function(targetWindow, messageData, origin) {
  var self = this,
      messageId = ++self._lastMessageId,
      envelope = {
        messageId: messageId,
        contents: messageData
      };
  self._ensureHasListener();
  return new Promises.Promise(function(complete, error) {
    self._pendingMessages[messageId] = {
      messageId: messageId,
      complete: complete,
      error: error,
      targetWindow: targetWindow,
      origin: origin
    };
    self._pendingMessages[messageId].timeoutId = global.setTimeout(function() {
      var pendingMessage = self._pendingMessages[messageId];
      if (pendingMessage) {
        delete self._pendingMessages[messageId];
        pendingMessage.error({
          status: 0,
          statusText: "Timeout",
          responseText: null
        });
      }
    }, messageTimeoutDuration);
    targetWindow.postMessage(JSON.stringify(envelope), origin);
  });
};
PostMessageExchange.prototype._ensureHasListener = function() {
  if (this._hasListener) {
    return;
  }
  this._hasListener = true;
  var self = this,
      boundHandleMessage = function() {
        self._handleMessage.apply(self, arguments);
      };
  if (window.addEventListener) {
    window.addEventListener('message', boundHandleMessage, false);
  } else {
    window.attachEvent('onmessage', boundHandleMessage);
  }
};
PostMessageExchange.prototype._handleMessage = function(evt) {
  var envelope = this._tryDeserializeMessage(evt.data),
      messageId = envelope && envelope.messageId,
      pendingMessage = messageId && this._pendingMessages[messageId],
      isValidReply = pendingMessage && pendingMessage.targetWindow === evt.source && pendingMessage.origin === getOriginRoot(evt.origin);
  if (isValidReply) {
    global.clearTimeout(pendingMessage.timeoutId);
    delete this._pendingMessages[messageId];
    pendingMessage.complete(envelope.contents);
  }
};
PostMessageExchange.prototype._tryDeserializeMessage = function(messageString) {
  if (!messageString || typeof messageString !== 'string') {
    return null;
  }
  try {
    return JSON.parse(messageString);
  } catch (ex) {
    return null;
  }
};
function getOriginRoot(url) {
  var parsedUrl = parseUrl(url),
      portString = parsedUrl.port ? parsedUrl.port.toString() : null,
      isDefaultPort = (parsedUrl.protocol === 'http:' && portString === '80') || (parsedUrl.protocol === 'https:' && portString === '443'),
      portSuffix = (portString && !isDefaultPort) ? ':' + portString : '';
  return parsedUrl.protocol + '//' + parsedUrl.hostname + portSuffix;
}
function parseUrl(url) {
  var elem = global.document.createElement('a');
  elem.href = url;
  return elem;
}
exports.instance = new PostMessageExchange();
exports.getOriginRoot = getOriginRoot;
