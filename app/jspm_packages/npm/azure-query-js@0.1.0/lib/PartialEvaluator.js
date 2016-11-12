/* */ 
(function() {
  var IndependenceNominator,
      JS,
      PartialEvaluator,
      _,
      extend = function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key))
            child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      },
      hasProp = {}.hasOwnProperty;
  _ = require('./Utilities');
  JS = require('./JavaScriptNodes');
  exports.PartialEvaluator = PartialEvaluator = (function(superClass) {
    extend(PartialEvaluator, superClass);
    function PartialEvaluator(context1) {
      this.context = context1;
    }
    PartialEvaluator.prototype.visit = function(node) {
      var key,
          params,
          ref,
          ref1,
          ref2,
          ref3,
          source,
          thunk,
          value,
          values;
      if (!node.__independent || node.type === 'Literal' || (!node.type)) {
        return PartialEvaluator.__super__.visit.call(this, node);
      } else {
        if (node.type === 'Identifier' && this.context.environment[node.name]) {
          return new JS.Literal(this.context.environment[node.name]);
        } else {
          source = this.context.source.slice(node != null ? (ref = node.range) != null ? ref[0] : void 0 : void 0, +((node != null ? (ref1 = node.range) != null ? ref1[1] : void 0 : void 0) - 1) + 1 || 9e9);
          params = (ref2 = (function() {
            var ref3,
                results;
            ref3 = this.context.environment;
            results = [];
            for (key in ref3) {
              value = ref3[key];
              results.push(key);
            }
            return results;
          }).call(this)) != null ? ref2 : [];
          values = (ref3 = (function() {
            var ref4,
                results;
            ref4 = this.context.environment;
            results = [];
            for (key in ref4) {
              value = ref4[key];
              results.push(JSON.stringify(value));
            }
            return results;
          }).call(this)) != null ? ref3 : [];
          thunk = "(function(" + params + ") { return " + source + "; })(" + values + ")";
          value = eval(thunk);
          return new JS.Literal(value);
        }
      }
    };
    PartialEvaluator.evaluate = function(context) {
      var evaluator,
          nominator;
      nominator = new IndependenceNominator(context);
      nominator.visit(context.expression);
      evaluator = new PartialEvaluator(context);
      return evaluator.visit(context.expression);
    };
    return PartialEvaluator;
  })(JS.JavaScriptVisitor);
  exports.IndependenceNominator = IndependenceNominator = (function(superClass) {
    extend(IndependenceNominator, superClass);
    function IndependenceNominator(context1) {
      this.context = context1;
    }
    IndependenceNominator.prototype.Literal = function(node) {
      IndependenceNominator.__super__.Literal.call(this, node);
      node.__independent = true;
      node.__hasThisExp = false;
      return node;
    };
    IndependenceNominator.prototype.ThisExpression = function(node) {
      IndependenceNominator.__super__.ThisExpression.call(this, node);
      node.__independent = false;
      node.__hasThisExp = true;
      return node;
    };
    IndependenceNominator.prototype.Identifier = function(node) {
      IndependenceNominator.__super__.Identifier.call(this, node);
      node.__independent = true;
      node.__hasThisExp = false;
      return node;
    };
    IndependenceNominator.prototype.MemberExpression = function(node) {
      var ref;
      IndependenceNominator.__super__.MemberExpression.call(this, node);
      node.__hasThisExp = (ref = node.object) != null ? ref.__hasThisExp : void 0;
      if (node.__hasThisExp) {
        node.__independent = false;
        if (node != null) {
          node.property.__independent = false;
        }
      }
      return node;
    };
    IndependenceNominator.prototype.CallExpression = function(node) {
      IndependenceNominator.__super__.CallExpression.call(this, node);
      node.__hasThisExp = node.callee.__hasThisExp;
      return node;
    };
    IndependenceNominator.prototype.ObjectExpression = function(node) {
      var i,
          independence,
          j,
          len,
          len1,
          ref,
          ref1,
          setter;
      IndependenceNominator.__super__.ObjectExpression.call(this, node);
      ref = node.properties;
      for (i = 0, len = ref.length; i < len; i++) {
        setter = ref[i];
        setter.key.__independent = false;
      }
      independence = true;
      ref1 = node.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        setter = ref1[j];
        independence &= setter.value.__independent;
      }
      node.__independent = independence ? true : false;
      return node;
    };
    IndependenceNominator.prototype.visit = function(node) {
      var i,
          independence,
          isIndependent,
          len,
          name,
          v,
          value;
      IndependenceNominator.__super__.visit.call(this, node);
      if (!(Object.prototype.hasOwnProperty.call(node, '__independent'))) {
        independence = true;
        isIndependent = function(node) {
          var ref;
          if (_.isObject(node)) {
            return (ref = value.__independent) != null ? ref : false;
          } else {
            return true;
          }
        };
        for (name in node) {
          value = node[name];
          if (_.isArray(value)) {
            for (i = 0, len = value.length; i < len; i++) {
              v = value[i];
              independence &= isIndependent(v);
            }
          } else if (_.isObject(value)) {
            independence &= isIndependent(value);
          }
        }
        node.__independent = independence ? true : false;
      }
      return node;
    };
    return IndependenceNominator;
  })(JS.JavaScriptVisitor);
}).call(this);
