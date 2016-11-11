var _ = require('lodash');
// Load the core build.
var _ = require('lodash/core');

var getProp = function (obj, paths, _i) {
    var i = _i || 0;
    if (i == paths.length - 1)
        return obj[paths[i]];
    return getProp(obj[paths[i]], paths, i + 1);
};

var selectValues = function (values, selector) {
    var result = [];
    _.each(values, function (value) {
        if (value[selector.propName] == selector.value)
            result.push(value);
    });
    return result;
};

var rankValues = function (values, rank) {
    if (!rank)
        return values;
    values.sort(function (x, y) {
        var result = x[rank.propName] > y[rank.propName];
        return rank.maxToMin ? !result : result;
    });
    var result = _.slice(values, 0, rank.limit);
    for (var i = result.length; i < rank.limit; i++)
        result.push({});
    return result;
};

var flatten = function(rankedValues, valueProp){
    var result = [];
    _.each(rankedValues, function(value){
        result.push(value[valueProp.propName]);
    });

    return result;
};

var getValues = function (obj, prop) {
    var valueObjs = getProp(obj, prop.path);
    var selectedValues = selectValues(valueObjs, prop.selector);
    var rankedValues = rankValues(selectedValues, prop.rank);
    var flatValues = flatten(rankedValues, prop.value);
    return flatValues;
};

var doMagic = function (obj, props) {
    var result = [];
    _.each(props, function (prop) {
        result = _.concat(result, getValues(obj, prop));
    });
    return result;
};

module.exports = {
    getMetaData: function (entity) {
        return doMagic(entity, [{
            path: ["_preliminary", "slugline_components"],
            selector: {
                propName: "type",
                value: "cpnat:geoArea"
            },
            rank: {
                propName: "name",
                maxToMin: true,
                limit: 3
            },
            value: {
                propName: "name"
            }
        }, {
            path: ["_preliminary", "slugline_components"],
            selector: {
                propName: "type",
                value: "dpatype:dpasubject"
            },
            rank: {
                propName: "rank",
                maxToMin: true,
                limit: 3
            },
            value: {
                propName: "name"
            }
        }]).join('|');
    }
}
