(function() {

    'use strict';

    let check;

    function checkQuery(meta, query) {
        let keys = _.keys(query);
        if (keys.length !== 1) {
            throw 'Bool sub-query must only have a single key, query has multiple keys: `' + JSON.stringify(keys) + '`.';
        }
        let type = keys[0];
        let checkFunc = check[type];
        if (!checkFunc) {
            throw 'Query type `' + type + '` is not recognized.';
        }
        // check query by type
        check[type](meta, query[type]);
    }

    function checkQueries(meta, queries) {
        if (_.isArray(queries)) {
            queries.forEach(query => {
                checkQuery(meta,query);
            });
            return queries;
        }
        checkQuery(meta, queries);
        return [
            queries
        ];
    }

    function checkBool(meta, query) {
        if (!query.must && !query.must_not && !query.should) {
            throw 'Bool must have at least one `must`, `must_not`, or `should` query argument.';
        }
        if (query.must) {
            checkQueries(meta, query.must);
        }
        if (query.must_not) {
            checkQueries(meta, query.must_not);
        }
        if (query.should) {
            checkQueries(meta, query.should);
        }
    }

    check = {
        bool: checkBool,
        exists: require('./Exists'),
        prefix: require('./Prefix'),
        query_string: require('./QueryString'),
        range: require('./Range'),
        terms: require('./Terms'),
        match: require('./Match'),
        has_parent: require('./ParentChild'),
        has_child: require('./ParentChild')
    };

    module.exports = checkBool;

}());
