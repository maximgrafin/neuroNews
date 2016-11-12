/* */ 
var Query = require('azure-query-js').Query,
    Platform = require('./Platform/index');
var queryOperators = ['where', 'select', 'orderBy', 'orderByDescending', 'skip', 'take', 'includeTotalCount'];
var copyOperator = function(table, operator) {
  table.prototype[operator] = function() {
    var table = this;
    var query = new Query(table.getTableName());
    query.read = function(parameters) {
      return table.read(query, parameters);
    };
    return query[operator].apply(query, arguments);
  };
};
function defineQueryOperators(table) {
  var i = 0;
  for (; i < queryOperators.length; i++) {
    copyOperator(table, queryOperators[i]);
  }
}
exports.defineQueryOperators = defineQueryOperators;
