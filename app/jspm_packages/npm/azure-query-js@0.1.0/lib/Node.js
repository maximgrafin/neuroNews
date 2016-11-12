/* */ 
(function() {
  var Node,
      Visitor,
      _;
  _ = require('./Utilities');
  exports.Node = Node = (function() {
    Node.prototype.type = 'Node';
    function Node() {
      this.type = _.functionName(this.constructor);
    }
    return Node;
  })();
  exports.Visitor = Visitor = (function() {
    function Visitor() {}
    Visitor.prototype.visit = function(node) {
      var element,
          i,
          len,
          results;
      if (_.isArray(node)) {
        results = [];
        for (i = 0, len = node.length; i < len; i++) {
          element = node[i];
          results.push(this.visit(element));
        }
        return results;
      } else if (!(node != null ? node.type : void 0)) {
        return node;
      } else if (!_.isFunction(this[node.type])) {
        throw "Unsupported expression " + (this.getSource(node));
      } else {
        return this[node.type](node);
      }
    };
    Visitor.prototype.getSource = function(node) {
      return null;
    };
    return Visitor;
  })();
}).call(this);
