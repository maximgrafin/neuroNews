/* */ 
var taskRunner = require('../../../src/Utilities/taskRunner'),
    Platform = require('../../../src/Platform/index');
var asyncTaskDuration = 100;
$testGroup('task runner', $test('synchronous task execution').checkAsync(function() {
  var runner = taskRunner(),
      hasRun;
  return runner.run(function() {
    hasRun = true;
  }).then(function() {
    $assert.isTrue(hasRun);
  }, function(error) {
    $assert.fail(error);
  });
}), $test('asynchronous task execution').checkAsync(function() {
  var runner = taskRunner(),
      hasRun;
  return runner.run(Platform.async(function(callback) {
    hasRun = true;
    callback();
  })).then(function() {
    $assert.isTrue(hasRun);
  }, function(error) {
    $assert.fail(error);
  });
}), $test('run should return the result of the synchronous task if it succeeds').checkAsync(function() {
  var runner = taskRunner(),
      expectedResult = 101;
  return runner.run(function() {
    return expectedResult;
  }).then(function(result) {
    $assert.areEqual(result, expectedResult);
  }, function(error) {
    $assert.fail(error);
  });
}), $test('run should return the result of the asynchronous task if it succeeds').checkAsync(function() {
  var runner = taskRunner(),
      expectedResult = 101;
  return runner.run(Platform.async(function(callback) {
    callback(null, expectedResult);
  })).then(function(result) {
    $assert.areEqual(result, expectedResult);
  }, function(error) {
    $assert.fail(error);
  });
}), $test('taskrunner should return the error of the queued synchronous task if it fails').checkAsync(function() {
  var runner = taskRunner(),
      expectedError = 'some error';
  return runner.run(function() {
    throw expectedError;
  }).then(function(result) {
    $assert.fail('test should have failed');
  }, function(error) {
    $assert.isNotNull(error);
    $assert.areEqual(error, expectedError);
  });
}), $test('taskrunner should return the error of the queued asynchronous task if it fails').checkAsync(function() {
  var runner = taskRunner(),
      expectedError = 'some error';
  return runner.run(Platform.async(function(callback) {
    callback(expectedError);
  })).then(function(result) {
    $assert.fail('test should have failed');
  }, function(error) {
    $assert.isNotNull(error);
    $assert.areEqual(error, expectedError);
  });
}), $test('synchronous tasks should be executed in the order in which they are queued').checkAsync(function() {
  var runner = taskRunner();
  var lastKnownIndex = -1,
      numTasks = 10;
  var result;
  for (var i = 0; i < numTasks; i++) {
    result = runner.run(getTask(i));
  }
  return result;
  function getTask(index) {
    return function() {
      $assert.areEqual(index, 1 + lastKnownIndex);
      lastKnownIndex = index;
      if (index % 2 !== numTasks % 2) {} else {
        throw 'some error';
      }
    };
  }
}), $test('asynchronous tasks should be executed in the order in which they are queued').checkAsync(function() {
  var runner = taskRunner();
  var lastKnownIndex = -1,
      numTasks = 10;
  var result;
  for (var i = 0; i < numTasks; i++) {
    result = runner.run(getTask(i));
  }
  return result;
  function getTask(index) {
    return Platform.async(function(callback) {
      $assert.areEqual(index, 1 + lastKnownIndex);
      lastKnownIndex = index;
      setTimeout(function() {
        if (index % 2 !== numTasks % 2) {
          callback();
        } else {
          callback('some error');
        }
      }, asyncTaskDuration);
    });
  }
}), $test('only one asynchronous task should run at a time').checkAsync(function() {
  var runner = taskRunner();
  var isTaskRunning,
      numTasks = 10;
  var result;
  for (var i = 0; i < numTasks; i++) {
    result = runner.run(getTask(i));
  }
  return result;
  function getTask(index) {
    return Platform.async(function(callback) {
      $assert.isFalse(isTaskRunning);
      isTaskRunning = true;
      setTimeout(function() {
        isTaskRunning = false;
        if (index % 2 !== numTasks % 2) {
          callback();
        } else {
          callback('some error');
        }
      }, asyncTaskDuration);
    });
  }
}), $test('synchronous task should not run if an asynchronous task is in progress').checkAsync(function() {
  var runner = taskRunner();
  var isTaskRunning,
      executionCount = 0,
      callback;
  runner.run(Platform.async(function(callback) {
    $assert.isFalse(isTaskRunning);
    isTaskRunning = true;
    setTimeout(function() {
      isTaskRunning = false;
      callback();
    }, asyncTaskDuration);
  })).then(function() {
    ++executionCount;
    $assert.areEqual(executionCount, 1);
  });
  var result = runner.run(function(callback) {
    $assert.isFalse(isTaskRunning);
  }).then(function() {
    ++executionCount;
    $assert.areEqual(executionCount, 2);
  });
  return result;
}), $test('asynchronous task chaining').checkAsync(function() {
  var runner = taskRunner();
  var numTasks = 10;
  var promise = Platform.async(function() {
    callback();
  })();
  for (var i = 0; i < numTasks; i++) {
    promise = addTask(promise, runner, getTask(i));
  }
  return promise.then(function(result) {
    $assert.areEqual(result, numTasks - 1);
  }, function(error) {
    $assert.fail(error);
  });
  function getTask(index) {
    return Platform.async(function(callback) {
      setTimeout(function() {
        if (index % 2 !== numTasks % 2) {
          callback(null, index);
        } else {
          callback('some error');
        }
      }, asyncTaskDuration);
    });
  }
}), $test('synchronous task chaining').checkAsync(function() {
  var runner = taskRunner();
  var numTasks = 10;
  var promise = Platform.async(function() {
    callback();
  })();
  for (var i = 0; i < numTasks; i++) {
    promise = addTask(promise, runner, getTask(i));
  }
  return promise.then(function(result) {
    $assert.areEqual(result, numTasks - 1);
  }, function(error) {
    $assert.fail(error);
  });
  function getTask(index) {
    return function() {
      if (index % 2 !== numTasks % 2) {
        return index;
      } else {
        throw 'some error';
      }
    };
  }
}), $test('error handling: invalid parameter passed to run should reject the returned promise').checkAsync(function() {
  var runner = taskRunner();
  return runner.run('invalid param').then(function() {
    $assert.fail('expected a failure');
  }, function(error) {});
}));
function addTask(chain, taskRunner, task) {
  return chain.then(function() {
    return taskRunner.run(task);
  }, function() {
    return taskRunner.run(task);
  });
}
