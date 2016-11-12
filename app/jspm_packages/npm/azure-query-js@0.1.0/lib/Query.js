/* */ 
(function() {
  var JavaScript,
      ODataProvider,
      Q,
      Query,
      _,
      slice = [].slice;
  _ = require('./Utilities');
  Q = require('./QueryNodes');
  JavaScript = require('./JavaScript').JavaScript;
  exports.Query = Query = (function() {
    function Query(table, context) {
      var _context,
          _filters,
          _includeDeleted,
          _includeTotalCount,
          _orderClauses,
          _ordering,
          _projection,
          _selections,
          _skip,
          _table,
          _take,
          _version;
      if (!table || !(_.isString(table))) {
        throw 'Expected the name of a table!';
      }
      _table = table;
      _context = context;
      _filters = null;
      _projection = null;
      _selections = [];
      _ordering = {};
      _orderClauses = [];
      _skip = null;
      _take = null;
      _includeTotalCount = false;
      _includeDeleted = false;
      _version = 0;
      this.getComponents = function() {
        return {
          filters: _filters,
          selections: _selections,
          projection: _projection,
          ordering: _ordering,
          orderClauses: _orderClauses,
          skip: _skip,
          take: _take,
          table: _table,
          context: _context,
          includeTotalCount: _includeTotalCount,
          includeDeleted: _includeDeleted,
          version: _version
        };
      };
      this.setComponents = function(components) {
        var ascending,
            i,
            len,
            name,
            property,
            ref,
            ref1,
            ref10,
            ref11,
            ref2,
            ref3,
            ref4,
            ref5,
            ref6,
            ref7,
            ref8,
            ref9;
        _version++;
        _filters = (ref = components != null ? components.filters : void 0) != null ? ref : null;
        _selections = (ref1 = components != null ? components.selections : void 0) != null ? ref1 : [];
        _projection = (ref2 = components != null ? components.projection : void 0) != null ? ref2 : null;
        _skip = (ref3 = components != null ? components.skip : void 0) != null ? ref3 : null;
        _take = (ref4 = components != null ? components.take : void 0) != null ? ref4 : null;
        _includeTotalCount = (ref5 = components != null ? components.includeTotalCount : void 0) != null ? ref5 : false;
        _includeDeleted = (ref6 = components != null ? components.includeDeleted : void 0) != null ? ref6 : false;
        _table = (ref7 = components != null ? components.table : void 0) != null ? ref7 : null;
        _context = (ref8 = components != null ? components.context : void 0) != null ? ref8 : null;
        if (components != null ? components.orderClauses : void 0) {
          _orderClauses = (ref9 = components != null ? components.orderClauses : void 0) != null ? ref9 : [];
          _ordering = {};
          for (i = 0, len = _orderClauses.length; i < len; i++) {
            ref10 = _orderClauses[i], name = ref10.name, ascending = ref10.ascending;
            _ordering[name] = ascending;
          }
        } else {
          _ordering = (ref11 = components != null ? components.ordering : void 0) != null ? ref11 : {};
          _orderClauses = [];
          for (property in _ordering) {
            _orderClauses.push({
              name: property,
              ascending: !!_ordering[property]
            });
          }
        }
        return this;
      };
      this.where = function() {
        var args,
            constraint,
            expr,
            name,
            value;
        constraint = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        _version++;
        expr = (function() {
          if (_.isFunction(constraint)) {
            return JavaScript.transformConstraint(constraint, args);
          } else if (_.isObject(constraint)) {
            return Q.QueryExpression.groupClauses(Q.BinaryOperators.And, (function() {
              var results;
              results = [];
              for (name in constraint) {
                value = constraint[name];
                results.push(expr = new Q.BinaryExpression(Q.BinaryOperators.Equal, new Q.MemberExpression(name), new Q.ConstantExpression(value)));
              }
              return results;
            })());
          } else if (_.isString(constraint)) {
            return new Q.LiteralExpression(constraint, args);
          } else {
            throw "Expected a function, object, or string, not " + constraint;
          }
        })();
        _filters = Q.QueryExpression.groupClauses(Q.BinaryOperators.And, [_filters, expr]);
        return this;
      };
      this.select = function() {
        var i,
            len,
            param,
            parameters,
            projectionOrParameter;
        projectionOrParameter = arguments[0], parameters = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        _version++;
        if (_.isString(projectionOrParameter)) {
          _selections.push(projectionOrParameter);
          for (i = 0, len = parameters.length; i < len; i++) {
            param = parameters[i];
            if (!(_.isString(param))) {
              throw "Expected string parameters, not " + param;
            }
            _selections.push(param);
          }
        } else if (_.isFunction(projectionOrParameter)) {
          _projection = projectionOrParameter;
          _selections = JavaScript.getProjectedFields(_projection);
        } else {
          throw "Expected a string or a function, not " + projectionOrParameter;
        }
        return this;
      };
      this.orderBy = function() {
        var i,
            j,
            len,
            len1,
            order,
            param,
            parameters,
            replacement;
        parameters = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        _version++;
        for (i = 0, len = parameters.length; i < len; i++) {
          param = parameters[i];
          if (!(_.isString(param))) {
            throw "Expected string parameters, not " + param;
          }
          _ordering[param] = true;
          replacement = false;
          for (j = 0, len1 = _orderClauses.length; j < len1; j++) {
            order = _orderClauses[j];
            if (order.name === param) {
              replacement = true;
              order.ascending = true;
            }
          }
          if (!replacement) {
            _orderClauses.push({
              name: param,
              ascending: true
            });
          }
        }
        return this;
      };
      this.orderByDescending = function() {
        var i,
            j,
            len,
            len1,
            order,
            param,
            parameters,
            replacement;
        parameters = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        _version++;
        for (i = 0, len = parameters.length; i < len; i++) {
          param = parameters[i];
          if (!(_.isString(param))) {
            throw "Expected string parameters, not " + param;
          }
          _ordering[param] = false;
          replacement = false;
          for (j = 0, len1 = _orderClauses.length; j < len1; j++) {
            order = _orderClauses[j];
            if (order.name === param) {
              replacement = true;
              order.ascending = false;
            }
          }
          if (!replacement) {
            _orderClauses.push({
              name: param,
              ascending: false
            });
          }
        }
        return this;
      };
      this.skip = function(count) {
        _version++;
        if (!(_.isNumber(count))) {
          throw "Expected a number, not " + count;
        }
        _skip = count;
        return this;
      };
      this.take = function(count) {
        _version++;
        if (!(_.isNumber(count))) {
          throw "Expected a number, not " + count;
        }
        _take = count;
        return this;
      };
      this.includeTotalCount = function() {
        _version++;
        _includeTotalCount = true;
        return this;
      };
      this.includeDeleted = function() {
        _version++;
        _includeDeleted = true;
        return this;
      };
    }
    Query.registerProvider = function(name, provider) {
      Query.Providers[name] = provider;
      return Query.prototype["to" + name] = function() {
        return provider != null ? typeof provider.toQuery === "function" ? provider.toQuery(this) : void 0 : void 0;
      };
    };
    Query.Providers = {};
    Query.Expressions = Q;
    return Query;
  })();
  ODataProvider = require('./ODataProvider').ODataProvider;
  Query.registerProvider('OData', new ODataProvider);
}).call(this);
