/* */ 
var Validate = require('../Utilities/Validate'),
    Platform = require('../Platform/index'),
    constants = require('../constants'),
    _ = require('../Utilities/Extensions');
exports.Push = Push;
function Push(client, installationId) {
  this.client = client;
  this.installationId = installationId;
}
Push.prototype.register = Platform.async(function(platform, pushChannel, templates, secondaryTiles, callback) {
  Validate.isString(platform, 'platform');
  Validate.notNullOrEmpty(platform, 'platform');
  if (_.isNull(callback) && (typeof templates === 'function')) {
    callback = templates;
    templates = null;
  }
  if (_.isNull(callback) && (typeof secondaryTiles === 'function')) {
    callback = secondaryTiles;
    secondaryTiles = null;
  }
  var requestContent = {
    installationId: this.installationId,
    pushChannel: pushChannel,
    platform: platform,
    templates: stringifyTemplateBodies(templates),
    secondaryTiles: stringifyTemplateBodies(secondaryTiles)
  };
  executeRequest(this.client, 'PUT', pushChannel, requestContent, this.installationId, callback);
});
Push.prototype.unregister = Platform.async(function(pushChannel, callback) {
  executeRequest(this.client, 'DELETE', pushChannel, null, this.installationId, callback);
});
function executeRequest(client, method, pushChannel, content, installationId, callback) {
  Validate.isString(pushChannel, 'pushChannel');
  Validate.notNullOrEmpty(pushChannel, 'pushChannel');
  var headers = {'If-Modified-Since': 'Mon, 27 Mar 1972 00:00:00 GMT'};
  headers[constants.apiVersionHeaderName] = constants.apiVersion;
  client._request(method, 'push/installations/' + encodeURIComponent(installationId), content, null, headers, callback);
}
function stringifyTemplateBodies(templates) {
  var result = {};
  for (var templateName in templates) {
    if (templates.hasOwnProperty(templateName)) {
      var template = _.extend({}, templates[templateName]);
      if (typeof template.body !== 'string') {
        template.body = JSON.stringify(template.body);
      }
      result[templateName] = template;
    }
  }
  return result;
}
