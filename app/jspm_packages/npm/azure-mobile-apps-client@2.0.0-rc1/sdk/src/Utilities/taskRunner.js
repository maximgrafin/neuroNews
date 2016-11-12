/* */ 
(function(process) {
  var Validate = require('./Validate'),
      Platform = require('../Platform/index');
  module.exports = function() {
    var queue = [],
        isBusy;
    return {run: run};
    function run(task) {
      return Platform.async(function(callback) {
        Validate.isFunction(task);
        Validate.isFunction(callback);
        queue.push({
          task: task,
          callback: callback
        });
        processTask();
      })();
    }
    function processTask() {
      setTimeout(function() {
        if (isBusy || queue.length === 0) {
          return;
        }
        isBusy = true;
        var next = queue.shift(),
            result,
            error;
        Platform.async(function(callback) {
          callback();
        })().then(function() {
          return next.task();
        }).then(function(res) {
          isBusy = false;
          processTask();
          next.callback(null, res);
        }, function(err) {
          isBusy = false;
          processTask();
          next.callback(err);
        });
      }, 0);
    }
  };
})(require('process'));
