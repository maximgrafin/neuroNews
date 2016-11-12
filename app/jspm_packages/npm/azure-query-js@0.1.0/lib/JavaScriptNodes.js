/* */ 
(function() {
  var ArrayExpression,
      ArrayPattern,
      AssignmentExpression,
      BinaryExpression,
      BlockStatement,
      BreakStatement,
      CallExpression,
      CatchClause,
      ConditionalExpression,
      ContinueStatement,
      DebuggerStatement,
      Declaration,
      DoWhileStatement,
      EmptyStatement,
      Expression,
      ExpressionStatement,
      ForInStatement,
      ForStatement,
      Function,
      FunctionDeclaration,
      FunctionExpression,
      Identifier,
      IfStatement,
      JavaScriptNode,
      JavaScriptVisitor,
      LabeledStatement,
      Literal,
      LogicalExpression,
      MemberExpression,
      NewExpression,
      Node,
      ObjectExpression,
      ObjectPattern,
      Pattern,
      Program,
      ReturnStatement,
      SequenceExpression,
      Statement,
      SwitchCase,
      SwitchStatement,
      ThisExpression,
      ThrowStatement,
      TryStatement,
      UnaryExpression,
      UpdateExpression,
      VariableDeclaration,
      VariableDeclarator,
      Visitor,
      WhileStatement,
      WithStatement,
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
  exports.JavaScriptNode = JavaScriptNode = (function(superClass) {
    extend(JavaScriptNode, superClass);
    function JavaScriptNode() {
      JavaScriptNode.__super__.constructor.call(this);
    }
    return JavaScriptNode;
  })(Node);
  exports.JavaScriptVisitor = JavaScriptVisitor = (function(superClass) {
    extend(JavaScriptVisitor, superClass);
    function JavaScriptVisitor() {
      JavaScriptVisitor.__super__.constructor.call(this);
    }
    JavaScriptVisitor.prototype.JavaScriptNode = function(node) {
      return node;
    };
    return JavaScriptVisitor;
  })(Visitor);
  exports.Program = Program = (function(superClass) {
    extend(Program, superClass);
    function Program(elements) {
      this.elements = elements;
      Program.__super__.constructor.call(this);
    }
    return Program;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Program = function(node) {
    node = this.JavaScriptNode(node);
    node.elements = this.visit(node.elements);
    return node;
  };
  exports.Function = Function = (function(superClass) {
    extend(Function, superClass);
    function Function(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      Function.__super__.constructor.call(this);
    }
    return Function;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Function = function(node) {
    node = this.JavaScriptNode(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };
  exports.Statement = Statement = (function(superClass) {
    extend(Statement, superClass);
    function Statement() {
      Statement.__super__.constructor.call(this);
    }
    return Statement;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Statement = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };
  exports.EmptyStatement = EmptyStatement = (function(superClass) {
    extend(EmptyStatement, superClass);
    function EmptyStatement() {
      EmptyStatement.__super__.constructor.call(this);
    }
    return EmptyStatement;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.EmptyStatement = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };
  exports.BlockStatement = BlockStatement = (function(superClass) {
    extend(BlockStatement, superClass);
    function BlockStatement(body) {
      this.body = body;
      BlockStatement.__super__.constructor.call(this);
    }
    return BlockStatement;
  })(Statement);
  JavaScriptVisitor.prototype.BlockStatement = function(node) {
    node = this.Statement(node);
    node.body = this.visit(node.body);
    return node;
  };
  exports.ExpressionStatement = ExpressionStatement = (function(superClass) {
    extend(ExpressionStatement, superClass);
    function ExpressionStatement() {
      ExpressionStatement.__super__.constructor.call(this);
    }
    return ExpressionStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ExpressionStatement = function(node) {
    node = this.Statement(node);
    return node;
  };
  exports.IfStatement = IfStatement = (function(superClass) {
    extend(IfStatement, superClass);
    function IfStatement(test, consequent, alternate) {
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      IfStatement.__super__.constructor.call(this);
    }
    return IfStatement;
  })(Statement);
  JavaScriptVisitor.prototype.IfStatement = function(node) {
    node = this.Statement(node);
    node.test = this.visit(node.test);
    node.consequent = this.visit(node.consequent);
    node.alternate = this.visit(node.alternate);
    return node;
  };
  exports.LabeledStatement = LabeledStatement = (function(superClass) {
    extend(LabeledStatement, superClass);
    function LabeledStatement(label, body) {
      this.label = label;
      this.body = body;
      LabeledStatement.__super__.constructor.call(this);
    }
    return LabeledStatement;
  })(Statement);
  JavaScriptVisitor.prototype.LabeledStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    node.body = this.visit(node.body);
    return node;
  };
  exports.BreakStatement = BreakStatement = (function(superClass) {
    extend(BreakStatement, superClass);
    function BreakStatement(label) {
      this.label = label;
      BreakStatement.__super__.constructor.call(this);
    }
    return BreakStatement;
  })(Statement);
  JavaScriptVisitor.prototype.BreakStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    return node;
  };
  exports.ContinueStatement = ContinueStatement = (function(superClass) {
    extend(ContinueStatement, superClass);
    function ContinueStatement(label) {
      this.label = label;
      ContinueStatement.__super__.constructor.call(this);
    }
    return ContinueStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ContinueStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    return node;
  };
  exports.WithStatement = WithStatement = (function(superClass) {
    extend(WithStatement, superClass);
    function WithStatement(object, body) {
      this.object = object;
      this.body = body;
      WithStatement.__super__.constructor.call(this);
    }
    return WithStatement;
  })(Statement);
  JavaScriptVisitor.prototype.WithStatement = function(node) {
    node = this.Statement(node);
    node.object = this.visit(node.object);
    node.body = this.visit(node.body);
    return node;
  };
  exports.SwitchStatement = SwitchStatement = (function(superClass) {
    extend(SwitchStatement, superClass);
    function SwitchStatement(discriminant, cases) {
      this.discriminant = discriminant;
      this.cases = cases;
      SwitchStatement.__super__.constructor.call(this);
    }
    return SwitchStatement;
  })(Statement);
  JavaScriptVisitor.prototype.SwitchStatement = function(node) {
    node = this.Statement(node);
    node.discriminant = this.visit(node.discriminant);
    node.cases = this.visit(node.cases);
    return node;
  };
  exports.ReturnStatement = ReturnStatement = (function(superClass) {
    extend(ReturnStatement, superClass);
    function ReturnStatement(argument) {
      this.argument = argument;
      ReturnStatement.__super__.constructor.call(this);
    }
    return ReturnStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ReturnStatement = function(node) {
    node = this.Statement(node);
    node.argument = this.visit(node.argument);
    return node;
  };
  exports.ThrowStatement = ThrowStatement = (function(superClass) {
    extend(ThrowStatement, superClass);
    function ThrowStatement(argument) {
      this.argument = argument;
      ThrowStatement.__super__.constructor.call(this);
    }
    return ThrowStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ThrowStatement = function(node) {
    node = this.Statement(node);
    node.argument = this.visit(node.argument);
    return node;
  };
  exports.TryStatement = TryStatement = (function(superClass) {
    extend(TryStatement, superClass);
    function TryStatement(block, handlers, finalizer) {
      this.block = block;
      this.handlers = handlers;
      this.finalizer = finalizer;
      TryStatement.__super__.constructor.call(this);
    }
    return TryStatement;
  })(Statement);
  JavaScriptVisitor.prototype.TryStatement = function(node) {
    node = this.Statement(node);
    node.block = this.visit(node.block);
    node.handlers = this.visit(node.handlers);
    node.finalizer = this.visit(node.finalizer);
    return node;
  };
  exports.WhileStatement = WhileStatement = (function(superClass) {
    extend(WhileStatement, superClass);
    function WhileStatement(test, body) {
      this.test = test;
      this.body = body;
      WhileStatement.__super__.constructor.call(this);
    }
    return WhileStatement;
  })(Statement);
  JavaScriptVisitor.prototype.WhileStatement = function(node) {
    node = this.Statement(node);
    node.test = this.visit(node.test);
    node.body = this.visit(node.body);
    return node;
  };
  exports.DoWhileStatement = DoWhileStatement = (function(superClass) {
    extend(DoWhileStatement, superClass);
    function DoWhileStatement(body, test) {
      this.body = body;
      this.test = test;
      DoWhileStatement.__super__.constructor.call(this);
    }
    return DoWhileStatement;
  })(Statement);
  JavaScriptVisitor.prototype.DoWhileStatement = function(node) {
    node = this.Statement(node);
    node.body = this.visit(node.body);
    node.test = this.visit(node.test);
    return node;
  };
  exports.ForStatement = ForStatement = (function(superClass) {
    extend(ForStatement, superClass);
    function ForStatement(init, test, update, body) {
      this.init = init;
      this.test = test;
      this.update = update;
      this.body = body;
      ForStatement.__super__.constructor.call(this);
    }
    return ForStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ForStatement = function(node) {
    node = this.Statement(node);
    node.init = this.visit(node.init);
    node.test = this.visit(node.test);
    node.update = this.visit(node.update);
    node.body = this.visit(node.body);
    return node;
  };
  exports.ForInStatement = ForInStatement = (function(superClass) {
    extend(ForInStatement, superClass);
    function ForInStatement(left, right, body) {
      this.left = left;
      this.right = right;
      this.body = body;
      ForInStatement.__super__.constructor.call(this);
    }
    return ForInStatement;
  })(Statement);
  JavaScriptVisitor.prototype.ForInStatement = function(node) {
    node = this.Statement(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    node.body = this.visit(node.body);
    return node;
  };
  exports.DebuggerStatement = DebuggerStatement = (function(superClass) {
    extend(DebuggerStatement, superClass);
    function DebuggerStatement() {
      DebuggerStatement.__super__.constructor.call(this);
    }
    return DebuggerStatement;
  })(Statement);
  JavaScriptVisitor.prototype.DebuggerStatement = function(node) {
    node = this.Statement(node);
    return node;
  };
  exports.Declaration = Declaration = (function(superClass) {
    extend(Declaration, superClass);
    function Declaration() {
      Declaration.__super__.constructor.call(this);
    }
    return Declaration;
  })(Statement);
  JavaScriptVisitor.prototype.Declaration = function(node) {
    node = this.Statement(node);
    return node;
  };
  exports.FunctionDeclaration = FunctionDeclaration = (function(superClass) {
    extend(FunctionDeclaration, superClass);
    function FunctionDeclaration(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      FunctionDeclaration.__super__.constructor.call(this);
    }
    return FunctionDeclaration;
  })(Declaration);
  JavaScriptVisitor.prototype.FunctionDeclaration = function(node) {
    node = this.Declaration(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };
  exports.VariableDeclaration = VariableDeclaration = (function(superClass) {
    extend(VariableDeclaration, superClass);
    function VariableDeclaration(declarations, kind) {
      this.declarations = declarations;
      this.kind = kind;
      VariableDeclaration.__super__.constructor.call(this);
    }
    return VariableDeclaration;
  })(Declaration);
  JavaScriptVisitor.prototype.VariableDeclaration = function(node) {
    node = this.Declaration(node);
    node.declarations = this.visit(node.declarations);
    return node;
  };
  exports.VariableDeclarator = VariableDeclarator = (function(superClass) {
    extend(VariableDeclarator, superClass);
    function VariableDeclarator(id, init) {
      this.id = id;
      this.init = init;
      VariableDeclarator.__super__.constructor.call(this);
    }
    return VariableDeclarator;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.VariableDeclarator = function(node) {
    node = this.JavaScriptNode(node);
    node.id = this.visit(node.id);
    node.init = this.visit(node.init);
    return node;
  };
  exports.Expression = Expression = (function(superClass) {
    extend(Expression, superClass);
    function Expression() {
      return Expression.__super__.constructor.apply(this, arguments);
    }
    Expression.prototype.constuctor = function() {
      return Expression.__super__.constuctor.call(this);
    };
    return Expression;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Expression = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };
  exports.ThisExpression = ThisExpression = (function(superClass) {
    extend(ThisExpression, superClass);
    function ThisExpression() {
      ThisExpression.__super__.constructor.call(this);
    }
    return ThisExpression;
  })(Expression);
  JavaScriptVisitor.prototype.ThisExpression = function(node) {
    node = this.Expression(node);
    return node;
  };
  exports.ArrayExpression = ArrayExpression = (function(superClass) {
    extend(ArrayExpression, superClass);
    function ArrayExpression(elements) {
      this.elements = elements;
      ArrayExpression.__super__.constructor.call(this);
    }
    return ArrayExpression;
  })(Expression);
  JavaScriptVisitor.prototype.ArrayExpression = function(node) {
    node = this.Expression(node);
    node.elements = this.visit(node.elements);
    return node;
  };
  exports.ObjectExpression = ObjectExpression = (function(superClass) {
    extend(ObjectExpression, superClass);
    function ObjectExpression(properties) {
      this.properties = properties;
      ObjectExpression.__super__.constructor.call(this);
    }
    return ObjectExpression;
  })(Expression);
  JavaScriptVisitor.prototype.ObjectExpression = function(node) {
    var i,
        len,
        ref1,
        setter;
    node = this.Expression(node);
    ref1 = node.properties;
    for (i = 0, len = ref1.length; i < len; i++) {
      setter = ref1[i];
      setter.key = this.visit(setter.key);
      setter.value = this.visit(setter.value);
    }
    return node;
  };
  exports.FunctionExpression = FunctionExpression = (function(superClass) {
    extend(FunctionExpression, superClass);
    function FunctionExpression(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      FunctionExpression.__super__.constructor.call(this);
    }
    return FunctionExpression;
  })(Expression);
  JavaScriptVisitor.prototype.FunctionExpression = function(node) {
    node = this.Expression(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };
  exports.SequenceExpression = SequenceExpression = (function(superClass) {
    extend(SequenceExpression, superClass);
    function SequenceExpression(expressions) {
      this.expressions = expressions;
      SequenceExpression.__super__.constructor.call(this);
    }
    return SequenceExpression;
  })(Expression);
  JavaScriptVisitor.prototype.SequenceExpression = function(node) {
    node = this.Expression(node);
    node.expressions = this.visit(node.expressions);
    return node;
  };
  exports.UnaryExpression = UnaryExpression = (function(superClass) {
    extend(UnaryExpression, superClass);
    function UnaryExpression(operator, prefix, argument) {
      this.operator = operator;
      this.prefix = prefix;
      this.argument = argument;
      UnaryExpression.__super__.constructor.call(this);
    }
    return UnaryExpression;
  })(Expression);
  JavaScriptVisitor.prototype.UnaryExpression = function(node) {
    node = this.Expression(node);
    node.argument = this.visit(node.argument);
    return node;
  };
  exports.BinaryExpression = BinaryExpression = (function(superClass) {
    extend(BinaryExpression, superClass);
    function BinaryExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      BinaryExpression.__super__.constructor.call(this);
    }
    return BinaryExpression;
  })(Expression);
  JavaScriptVisitor.prototype.BinaryExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };
  exports.AssignmentExpression = AssignmentExpression = (function(superClass) {
    extend(AssignmentExpression, superClass);
    function AssignmentExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      AssignmentExpression.__super__.constructor.call(this);
    }
    return AssignmentExpression;
  })(Expression);
  JavaScriptVisitor.prototype.AssignmentExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };
  exports.UpdateExpression = UpdateExpression = (function(superClass) {
    extend(UpdateExpression, superClass);
    function UpdateExpression(operator, argument, prefix) {
      this.operator = operator;
      this.argument = argument;
      this.prefix = prefix;
      UpdateExpression.__super__.constructor.call(this);
    }
    return UpdateExpression;
  })(Expression);
  JavaScriptVisitor.prototype.UpdateExpression = function(node) {
    node = this.Expression(node);
    node.argument = this.visit(node.argument);
    return node;
  };
  exports.LogicalExpression = LogicalExpression = (function(superClass) {
    extend(LogicalExpression, superClass);
    function LogicalExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      LogicalExpression.__super__.constructor.call(this);
    }
    return LogicalExpression;
  })(Expression);
  JavaScriptVisitor.prototype.LogicalExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };
  exports.ConditionalExpression = ConditionalExpression = (function(superClass) {
    extend(ConditionalExpression, superClass);
    function ConditionalExpression(test, alternate, consequent) {
      this.test = test;
      this.alternate = alternate;
      this.consequent = consequent;
      ConditionalExpression.__super__.constructor.call(this);
    }
    return ConditionalExpression;
  })(Expression);
  JavaScriptVisitor.prototype.ConditionalExpression = function(node) {
    node = this.Expression(node);
    node.test = this.visit(node.test);
    node.alternate = this.visit(node.alternate);
    node.consequent = this.visit(node.consequent);
    return node;
  };
  exports.NewExpression = NewExpression = (function(superClass) {
    extend(NewExpression, superClass);
    function NewExpression(callee, _arguments) {
      this.callee = callee;
      this["arguments"] = _arguments;
      NewExpression.__super__.constructor.call(this);
    }
    return NewExpression;
  })(Expression);
  JavaScriptVisitor.prototype.NewExpression = function(node) {
    node = this.Expression(node);
    node.callee = this.visit(node.callee);
    node["arguments"] = this.visit(node["arguments"]);
    return node;
  };
  exports.CallExpression = CallExpression = (function(superClass) {
    extend(CallExpression, superClass);
    function CallExpression(callee, _arguments) {
      this.callee = callee;
      this["arguments"] = _arguments;
      CallExpression.__super__.constructor.call(this);
    }
    return CallExpression;
  })(Expression);
  JavaScriptVisitor.prototype.CallExpression = function(node) {
    node = this.Expression(node);
    node.callee = this.visit(node.callee);
    node["arguments"] = this.visit(node["arguments"]);
    return node;
  };
  exports.MemberExpression = MemberExpression = (function(superClass) {
    extend(MemberExpression, superClass);
    function MemberExpression(object, property, computed) {
      this.object = object;
      this.property = property;
      this.computed = computed;
      MemberExpression.__super__.constructor.call(this);
    }
    return MemberExpression;
  })(Expression);
  JavaScriptVisitor.prototype.MemberExpression = function(node) {
    node = this.Expression(node);
    node.object = this.visit(node.object);
    node.property = this.visit(node.property);
    return node;
  };
  exports.Pattern = Pattern = (function(superClass) {
    extend(Pattern, superClass);
    function Pattern() {
      Pattern.__super__.constructor.call(this);
    }
    return Pattern;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Pattern = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };
  exports.ObjectPattern = ObjectPattern = (function(superClass) {
    extend(ObjectPattern, superClass);
    function ObjectPattern(properties) {
      this.properties = properties;
      ObjectPattern.__super__.constructor.call(this);
    }
    return ObjectPattern;
  })(Pattern);
  JavaScriptVisitor.prototype.ObjectPattern = function(node) {
    var i,
        len,
        ref1,
        setter;
    node = this.Pattern(node);
    ref1 = node.properties;
    for (i = 0, len = ref1.length; i < len; i++) {
      setter = ref1[i];
      setter.key = this.visit(setter.key);
      setter.value = this.visit(setter.value);
    }
    return node;
  };
  exports.ArrayPattern = ArrayPattern = (function(superClass) {
    extend(ArrayPattern, superClass);
    function ArrayPattern(elements) {
      this.elements = elements;
      ArrayPattern.__super__.constructor.call(this);
    }
    return ArrayPattern;
  })(Pattern);
  JavaScriptVisitor.prototype.ArrayPattern = function(node) {
    node = this.Pattern(node);
    node.elements = this.visit(node.elements);
    return node;
  };
  exports.SwitchCase = SwitchCase = (function(superClass) {
    extend(SwitchCase, superClass);
    function SwitchCase(test, consequent) {
      this.test = test;
      this.consequent = consequent;
      SwitchCase.__super__.constructor.call(this);
    }
    return SwitchCase;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.SwitchCase = function(node) {
    node = this.JavaScriptNode(node);
    node.test = this.visit(node.test);
    node.consequent = this.visit(node.consequent);
    return node;
  };
  exports.CatchClause = CatchClause = (function(superClass) {
    extend(CatchClause, superClass);
    function CatchClause(param, body) {
      this.param = param;
      this.body = body;
      CatchClause.__super__.constructor.call(this);
    }
    return CatchClause;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.CatchClause = function(node) {
    node = this.JavaScriptNode(node);
    node.param = this.visit(node.param);
    node.body = this.visit(node.body);
    return node;
  };
  exports.Identifier = Identifier = (function(superClass) {
    extend(Identifier, superClass);
    function Identifier(name) {
      this.name = name;
      Identifier.__super__.constructor.call(this);
    }
    return Identifier;
  })(JavaScriptNode);
  JavaScriptVisitor.prototype.Identifier = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };
  exports.Literal = Literal = (function(superClass) {
    extend(Literal, superClass);
    function Literal(value) {
      this.value = value;
      Literal.__super__.constructor.call(this);
    }
    return Literal;
  })(Expression);
  JavaScriptVisitor.prototype.Literal = function(node) {
    node = this.Expression(node);
    return node;
  };
}).call(this);
