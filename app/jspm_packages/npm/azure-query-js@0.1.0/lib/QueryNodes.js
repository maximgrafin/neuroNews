/* */ 
(function() {
  var BinaryExpression,
      ConstantExpression,
      InvocationExpression,
      LiteralExpression,
      MemberExpression,
      Node,
      QueryExpression,
      QueryExpressionVisitor,
      UnaryExpression,
      Visitor,
      ref,
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
  ref = require('./Node'), Node = ref.Node, Visitor = ref.Visitor;
  exports.QueryExpression = QueryExpression = (function(superClass) {
    extend(QueryExpression, superClass);
    function QueryExpression() {
      QueryExpression.__super__.constructor.call(this);
    }
    QueryExpression.groupClauses = function(operator, clauses) {
      var combine;
      combine = function(left, right) {
        if (!left) {
          return right;
        } else if (!right) {
          return left;
        } else {
          return new BinaryExpression(operator, left, right);
        }
      };
      return clauses.reduce(combine, null);
    };
    return QueryExpression;
  })(Node);
  exports.QueryExpressionVisitor = QueryExpressionVisitor = (function(superClass) {
    extend(QueryExpressionVisitor, superClass);
    function QueryExpressionVisitor() {
      QueryExpressionVisitor.__super__.constructor.call(this);
    }
    QueryExpressionVisitor.prototype.QueryExpression = function(node) {
      return node;
    };
    return QueryExpressionVisitor;
  })(Visitor);
  exports.ConstantExpression = ConstantExpression = (function(superClass) {
    extend(ConstantExpression, superClass);
    function ConstantExpression(value) {
      this.value = value;
      ConstantExpression.__super__.constructor.call(this);
    }
    return ConstantExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.ConstantExpression = function(node) {
    return this.QueryExpression(node);
  };
  exports.MemberExpression = MemberExpression = (function(superClass) {
    extend(MemberExpression, superClass);
    function MemberExpression(member) {
      this.member = member;
      MemberExpression.__super__.constructor.call(this);
    }
    return MemberExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.MemberExpression = function(node) {
    return this.QueryExpression(node);
  };
  exports.BinaryExpression = BinaryExpression = (function(superClass) {
    extend(BinaryExpression, superClass);
    function BinaryExpression(operator1, left1, right1) {
      this.operator = operator1;
      this.left = left1;
      this.right = right1;
      BinaryExpression.__super__.constructor.call(this);
    }
    return BinaryExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.BinaryExpression = function(node) {
    node = this.QueryExpression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };
  exports.BinaryOperators = {
    And: 'And',
    Or: 'Or',
    Add: 'Add',
    Subtract: 'Subtract',
    Multiply: 'Multiply',
    Divide: 'Divide',
    Modulo: 'Modulo',
    GreaterThan: 'GreaterThan',
    GreaterThanOrEqual: 'GreaterThanOrEqual',
    LessThan: 'LessThan',
    LessThanOrEqual: 'LessThanOrEqual',
    NotEqual: 'NotEqual',
    Equal: 'Equal'
  };
  exports.UnaryExpression = UnaryExpression = (function(superClass) {
    extend(UnaryExpression, superClass);
    function UnaryExpression(operator1, operand) {
      this.operator = operator1;
      this.operand = operand;
      UnaryExpression.__super__.constructor.call(this);
    }
    return UnaryExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.UnaryExpression = function(node) {
    node = this.QueryExpression(node);
    node.operand = this.visit(node.operand);
    return node;
  };
  exports.UnaryOperators = {
    Not: 'Not',
    Negate: 'Negate',
    Increment: 'Increment',
    Decrement: 'Decrement'
  };
  exports.InvocationExpression = InvocationExpression = (function(superClass) {
    extend(InvocationExpression, superClass);
    function InvocationExpression(method, args) {
      this.method = method;
      this.args = args;
      InvocationExpression.__super__.constructor.call(this);
    }
    return InvocationExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.InvocationExpression = function(node) {
    node = this.QueryExpression(node);
    node.args = this.visit(node.args);
    return node;
  };
  exports.Methods = {
    Length: 'Length',
    ToUpperCase: 'ToUpperCase',
    ToLowerCase: 'ToLowerCase',
    Trim: 'Trim',
    IndexOf: 'IndexOf',
    Replace: 'Replace',
    Substring: 'Substring',
    Concat: 'Concat',
    Day: 'Day',
    Month: 'Month',
    Year: 'Year',
    Floor: 'Floor',
    Ceiling: 'Ceiling',
    Round: 'Round'
  };
  exports.LiteralExpression = LiteralExpression = (function(superClass) {
    extend(LiteralExpression, superClass);
    function LiteralExpression(queryString, args) {
      this.queryString = queryString;
      this.args = args != null ? args : [];
      LiteralExpression.__super__.constructor.call(this);
    }
    return LiteralExpression;
  })(QueryExpression);
  QueryExpressionVisitor.prototype.LiteralExpression = function(node) {
    return this.QueryExpression(node);
  };
}).call(this);
