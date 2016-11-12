/* */ 
var Platform = require('../../../src/Platform/index'),
    _ = require('../../../src/Utilities/Extensions');
function runActions(actions) {
  var chain = Platform.async(function(callback) {
    callback();
  })();
  for (var i in actions) {
    chain = runAction(chain, actions[i]);
  }
  return chain;
}
function runAction(chain, action) {
  return chain.then(function(result) {
    if (_.isFunction(action)) {
      return action(result);
    }
    if (_.isArray(action)) {
      var self = action[0];
      var func = action[1];
      if (_.isFunction(func)) {
        return func.apply(self, action.slice(2));
      }
    }
    if (_.isObject(action)) {
      if (action.success) {
        return action.success(result);
      } else {
        $assert.fail('Expected failure while running action ' + action);
      }
    }
    $assert.fail('Incorrect action definition');
  }, function(error) {
    if (action && action.fail) {
      return action.fail(error);
    } else {
      $assert.fail('Unexpected failure while running action : ' + action);
      $assert.fail(error);
    }
  });
}
module.exports = {runActions: runActions};
