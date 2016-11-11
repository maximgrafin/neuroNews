var test_obj = {
    "_is_full_topic": true,
    "_preliminary": {
        "links": [
            {
                "href": "https://blog.google/topics/google-europe/android-choice-competition-response-europe/",
                "rank": 1,
                "title": "Blogeintrag von Google",
                "type": "irel:seeAlso"
            }
        ],
        "slugline_components": [
            {
                "name": "Wirtschaft",
                "qcode": "dpacat:wi",
                "type": "dpatype:category"
            },
            {
                "name": "Telekommunikation",
                "qcode": "dpasubject:297",
                "rank": 1,
                "type": "dpatype:dpasubject"
            },
            {
                "name": "Internet",
                "qcode": "dpasubject:377",
                "rank": 2,
                "type": "dpatype:dpasubject"
            },
            {
                "name": "EU",
                "qcode": "dpasubject:157",
                "rank": 3,
                "type": "dpatype:dpasubject"
            },
            {
                "name": "USA",
                "qcode": "dpacountry:184",
                "rank": 1,
                "type": "cpnat:geoArea"
            },
            {
                "name": "Wettbewerb",
                "rank": 1,
                "type": "keyword"
            }
        ]
    },
    "_urn": "urn:newsml:dpa.com:20090101:161110-99-136351",
    "_version": 3,
    "categories": [
        {
            "scheme": "urn:dpa-newslab.com:category.urgency",
            "term": 4
        },
        {
            "label": "Zusammenfassung",
            "scheme": "genre",
            "term": "dpatextgenre:26"
        },
        {
            "label": "wi",
            "scheme": "ressort",
            "term": "dpacat:wi"
        }
    ],
    "content": "",
    "description": "Die EU-Kommission wirft Google in drei Verfahren Wettbewerbsverstöße vor. Der Internet-Konzern bestreitet bisher in allen Fällen, die Konkurrenz zu behindern - so jetzt auch beim dominierenden Smartphone-System Android.",
    "id": "0e4d25faf5a8d9e650aa64ce6ae581f70d15fe9e",
    "tags": [
        "dnldoctype:article",
        "dpacat:wi",
        "dpasrv:bdt",
        "dpasrv:edi",
        "dpasrv:edt",
        "dpasrv:erd",
        "dpasubject:297",
        "dpatextgenre:26",
        "g2:newsItem",
        "ninat:text",
        "sig:correction",
        "stat:usable"
    ],
    "title": "Google weist Android-Wettbewerbsvorwürfe der EU-Kommission zurück",
    "updated": "2016-11-10T22:42:52+0100"
};

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

var del_me = function () {
    return doMagic(test_obj, [{
        path: ["_preliminary", "slugline_components"],
        selector: {
            propName: "type",
            value: "cpnat:geoArea"
        },
        rank: {
            propName: "name",
            maxToMin: true,
            limit: 2
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
            limit: 2
        },
        value: {
            propName: "name"
        }
    }]);
};
