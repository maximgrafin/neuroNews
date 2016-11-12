/* */ 
(function() {
  var JS,
      JavaScript,
      JavaScriptToQueryVisitor,
      PartialEvaluator,
      esprima;
  esprima = require('esprima');
  JS = require('./JavaScriptNodes');
  PartialEvaluator = require('./PartialEvaluator').PartialEvaluator;
  JavaScriptToQueryVisitor = require('./JavaScriptToQueryVisitor').JavaScriptToQueryVisitor;
  exports.JavaScript = JavaScript = (function() {
    function JavaScript() {}
    JavaScript.transformConstraint = function(func, env) {
      var context,
          translator;
      context = JavaScript.getExpression(func, env);
      context.expression = PartialEvaluator.evaluate(context);
      translator = new JavaScriptToQueryVisitor(context);
      return translator.visit(context.expression);
    };
    JavaScript.getProjectedFields = function(func) {
      return [];
    };
    JavaScript.getExpression = function(func, env) {
      var environment,
          expr,
          i,
          j,
          len,
          name,
          names,
          program,
          ref,
          ref1,
          ref10,
          ref11,
          ref12,
          ref13,
          ref2,
          ref3,
          ref4,
          ref5,
          ref6,
          ref7,
          ref8,
          ref9,
          source;
      source = "var _$$_stmt_$$_ = " + func + ";";
      program = esprima.parse(source, {range: true});
      expr = (program != null ? program.type : void 0) === 'Program' && (program != null ? (ref = program.body) != null ? ref.length : void 0 : void 0) === 1 && ((ref1 = program.body[0]) != null ? ref1.type : void 0) === 'VariableDeclaration' && ((ref2 = program.body[0]) != null ? (ref3 = ref2.declarations) != null ? ref3.length : void 0 : void 0) === 1 && ((ref4 = program.body[0].declarations[0]) != null ? ref4.type : void 0) === 'VariableDeclarator' && ((ref5 = program.body[0].declarations[0]) != null ? (ref6 = ref5.init) != null ? ref6.type : void 0 : void 0) === 'FunctionExpression' && ((ref7 = program.body[0].declarations[0].init) != null ? (ref8 = ref7.body) != null ? ref8.type : void 0 : void 0) === 'BlockStatement' && ((ref9 = program.body[0].declarations[0].init.body) != null ? (ref10 = ref9.body) != null ? ref10.length : void 0 : void 0) === 1 && ((ref11 = program.body[0].declarations[0].init.body.body[0]) != null ? ref11.type : void 0) === 'ReturnStatement' && ((ref12 = program.body[0].declarations[0].init.body.body[0]) != null ? ref12.argument : void 0);
      if (!expr) {
        throw "Expected a predicate with a single return statement, not " + func;
      }
      names = (ref13 = program.body[0].declarations[0].init.params) != null ? ref13.map(function(p) {
        return p.name;
      }) : void 0;
      if (names.length > env.length) {
        throw "Expected value(s) for parameter(s) " + names.slice(env.length);
      } else if (env.length > names.length) {
        throw "Expected parameter(s) for value(s) " + env.slice(names.length);
      }
      environment = {};
      for (i = j = 0, len = names.length; j < len; i = ++j) {
        name = names[i];
        environment[name] = env[i];
      }
      return {
        source: source,
        expression: expr,
        environment: environment
      };
    };
    return JavaScript;
  })();
}).call(this);
