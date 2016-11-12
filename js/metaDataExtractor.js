var _ = require('lodash');
// Load the core build.
var _ = require('lodash/core');
var common = require('./common');
var cognitiveservices = require('./cognitiveservices');

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

var findTag = function(entity, prefix){
    var result = null;
    _.each(entity.tags, function(tag){
        if(tag.indexOf(prefix) >=0){
            result = tag.substring(prefix.length, tag.length);
        }

    });
    return result;
};

var getMetaData = function (pieceOfNews) {
    var metadata = [];
    var date = new Date(pieceOfNews.updated);
    var day = date.getDay();
    metadata.push(day);

    var hour = date.getHours();
    metadata.push(hour);

    var genre = findTag(pieceOfNews, "dpatextgenre:");
    metadata.push(genre);

    // return metadata;
        metadata = metadata.concat(doMagic(pieceOfNews, [{
        path: ["_preliminary", "slugline_components"],
        selector: {
            propName: "type",
            value: "cpnat:geoArea"
        },
        rank: {
            propName: "name",
            maxToMin: false,
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
            maxToMin: false,
            limit: 3
        },
        value: {
            propName: "name"
        }
    }, {
        path: ["categories"],
        selector: {
            propName: "scheme",
            value: "urn:dpa-newslab.com:category.urgency"
        },
        value: {
            propName: "term"
        }
    }]));
    
    metadata.unshift(1);
    metadata.push(pieceOfNews.title.replace(/[\n\,]/g, ''));
    metadata.push(pieceOfNews.title.length);
    metadata.push(pieceOfNews.content.length);

    // fix here so that pushes coming
    /*
    cognitiveservices.extractKeywords(pieceOfNews, function(data) {
        metadata.push(data.length);
        metadata.push(data.map(x => common.getJsonValue(x, ' ')).join(' '));
        for (i=0; i < 5; i++) {
            if (data.length > i)
                metadata.push(data[i]);
            else
                metadata.push(null);
        }
    });
    */

    return metadata;
};

module.exports = {
    getMetaData: getMetaData
};
