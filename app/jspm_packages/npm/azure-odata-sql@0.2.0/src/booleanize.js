/* */ 
var types = require('./utilities/types'),
    ExpressionVisitor = require('./ExpressionVisitor'),
    expressions = require('./expressions');
var SqlBooleanizer = types.deriveClass(ExpressionVisitor, null, {
  visitUnary: function(expr) {
    var operand = this.visit(expr.operand);
    if (operand && expr.expressionType == 'Not') {
      return new expressions.Unary(ensureExpressionIsBoolean(operand), 'Not');
    }
    if (operand != expr.operand) {
      return new expressions.Unary(operand, expr.expressionType);
    }
    return expr;
  },
  visitBinary: function(expr) {
    var left = null;
    var right = null;
    if (expr.left !== null) {
      left = this.visit(expr.left);
    }
    if (expr.right !== null) {
      right = this.visit(expr.right);
    }
    if ((expr.expressionType == 'And') || (expr.expressionType == 'Or')) {
      left = ensureExpressionIsBoolean(left);
      right = ensureExpressionIsBoolean(right);
    } else if ((expr.expressionType == 'Equal') || (expr.expressionType == 'NotEqual')) {
      var converted = rewriteBitComparison(left, right);
      if (converted) {
        return converted;
      }
    }
    if (left != expr.left || right != expr.right) {
      return new expressions.Binary(left, right, expr.expressionType);
    }
    return expr;
  }
});
function rewriteBitComparison(left, right) {
  if (isBooleanExpression(left) && isBitConstant(right)) {
    return (right.value === true) ? left : new expressions.Unary(left, 'Not');
  } else if (isBooleanExpression(right) && isBitConstant(left)) {
    return (left.value === true) ? right : new expressions.Unary(right, 'Not');
  }
  return null;
}
function isBitConstant(expr) {
  return (expr.expressionType == 'Constant') && (expr.value === true || expr.value === false);
}
function ensureExpressionIsBoolean(expr) {
  if (!isBooleanExpression(expr)) {
    return new expressions.Binary(expr, new expressions.Constant(true), 'Equal');
  }
  return expr;
}
function isBooleanExpression(expr) {
  if (!expr) {
    return false;
  }
  switch (expr.expressionType) {
    case 'And':
    case 'Or':
    case 'GreaterThan':
    case 'GreaterThanOrEqual':
    case 'LessThan':
    case 'LessThanOrEqual':
    case 'Not':
    case 'Equal':
    case 'NotEqual':
      return true;
    default:
      break;
  }
  if (expr.expressionType == 'Call') {
    switch (expr.memberInfo.memberName) {
      case 'startswith':
      case 'endswith':
      case 'substringof':
        return true;
      default:
        break;
    }
  }
  return false;
}
module.exports = function(expr) {
  var booleanizer = new SqlBooleanizer();
  expr = booleanizer.visit(expr);
  expr = ensureExpressionIsBoolean(expr);
  return expr;
};
