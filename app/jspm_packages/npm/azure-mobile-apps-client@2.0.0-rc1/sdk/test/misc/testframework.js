/* */ 
var Platform = require('../../src/Platform/index');
$test = function(testName) {
  return new Test(testName);
};
$testGroup = function(groupName) {
  var testsArray = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : null;
  var testGroup = new TestGroup(groupName, testsArray);
  $testGroups.push(testGroup);
  return testGroup;
};
$run = function(excludeFunctionalTests) {
  for (var index = 0; index < $testGroups.length; index++) {
    $testGroups[index].exec(excludeFunctionalTests);
  }
};
$assert = {
  isTrue: QUnit.ok,
  isFalse: function(value, message) {
    QUnit.ok(!value, message);
  },
  isNull: function(value, message) {
    QUnit.ok(value === null || value === undefined, message);
  },
  isNotNull: function(value, message) {
    QUnit.ok(value !== null && value !== undefined, message);
  },
  areEqual: QUnit.deepEqual,
  areNotEqual: QUnit.notDeepEqual,
  fail: function(message) {
    QUnit.ok(false, message);
  },
  contains: function(str, substr, message) {
    message = message || (str + " should contain " + substr);
    QUnit.ok((str || "").indexOf(substr) >= 0, message);
  }
};
$assertThrows = function(action, verify, message) {
  var thrown = true;
  try {
    action();
    thrown = false;
  } catch (ex) {
    if (verify) {
      verify(ex);
    }
  }
  if (!thrown) {
    $assert.fail(message || 'Should have failed!');
  }
};
$chain = Platform.async(function() {
  var actions = Array.prototype.slice.call(arguments, 0, -1);
  var callback = arguments[arguments.length - 1];
  var error = function(ex) {
    callback(null, ex.responseText || JSON.stringify(ex));
  };
  var exec = function(prev) {
    if (actions.length > 0) {
      var next = actions.shift();
      try {
        var result = next(prev);
        if (result) {
          result.then(function(results) {
            exec(results);
          }, error);
        } else if (actions.length === 0) {
          callback();
        } else {
          error('$chain expects all actions except the last to return another Promise');
        }
      } catch (ex) {
        error(ex);
      }
    } else {
      callback();
    }
  };
  exec();
});
$log = function(message) {
  if (console) {
    console.log(message);
  }
};
$fmt = function(formatString) {
  var positionalArgs = Array.prototype.slice.call(arguments, 1),
      index;
  for (index = 0; index < positionalArgs.length; index++) {
    formatString = formatString.replace("{" + index + "}", positionalArgs[index]);
  }
  return formatString;
};
$testGroups = [];
function Test(testName) {
  this.testName = testName;
  this.tags = [];
}
Test.prototype.exclude = function() {
  this.isExcluded = true;
  return this;
};
Test.prototype.check = function(testFunc) {
  this.testFunc = testFunc;
  return this;
};
Test.prototype.checkAsync = function(testFunc) {
  this.isAsync = true;
  return this.check(testFunc);
};
Test.prototype.exec = function(excludeFunctionalTests) {
  if (this._shouldExclude(excludeFunctionalTests)) {
    return;
  }
  var self = this;
  QUnit.test(this.testName, function() {
    QUnit.ok(!!self.testFunc, "Test function was supplied");
    var result = self.testFunc();
    if (self.isAsync) {
      QUnit.ok(typeof result.then === "function", "Async test returned a promise");
      QUnit.stop();
      result.then(function() {
        QUnit.start();
      }, function(err) {
        QUnit.start();
        QUnit.ok(false, err && err.exception || err);
      });
    }
  });
};
Test.prototype.tag = function(tagText) {
  this.tags.push(tagText);
  return this;
};
Test.prototype._shouldExclude = function(excludeFunctionalTests) {
  return this.isExcluded || this._hasTag("exclude-web") || (this.isFunctional && excludeFunctionalTests);
};
Test.prototype._hasTag = function(tagText) {
  for (var i = 0; i < this.tags.length; i++) {
    if (this.tags[i] === tagText) {
      return true;
    }
  }
  return false;
};
Test.prototype.functional = function() {
  this.isFunctional = true;
  return this;
};
Test.prototype.description = function() {
  return this;
};
function TestGroup(groupName, testsArray) {
  this.groupName = groupName;
  if (testsArray) {
    this.tests.apply(this, testsArray);
  }
}
TestGroup.prototype.functional = function() {
  this.isFunctional = true;
  return this;
};
TestGroup.prototype.beforeEachAsync = function(action) {
  this._beforeEachAction = action;
  return this;
};
TestGroup.prototype.afterEachAsync = function(action) {
  this._afterEachAction = action;
  return this;
};
TestGroup.prototype.tests = function() {
  this.testsArray = Array.prototype.slice.call(arguments, 0);
  return this;
};
TestGroup.prototype.exec = function(excludeFunctionalTests) {
  if (this.isFunctional && excludeFunctionalTests) {
    return;
  }
  var testEnvironment = {};
  if (this._beforeEachAction) {
    var beforeEachAction = this._beforeEachAction;
    testEnvironment.beforeEach = function() {
      performAsyncAction(beforeEachAction);
    };
  }
  if (this._afterEachAction) {
    var afterEachAction = this._afterEachAction;
    testEnvironment.afterEach = function() {
      performAsyncAction(afterEachAction);
    };
  }
  QUnit.module(this.groupName, testEnvironment);
  for (var i = 0; i < this.testsArray.length; i++) {
    this.testsArray[i].exec(excludeFunctionalTests);
  }
};
function performAsyncAction(action) {
  QUnit.stop();
  action().then(QUnit.start, function(err) {
    QUnit.start();
    QUnit.ok(false, err && err.exception || err);
  });
}
