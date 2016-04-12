(function(){

  'use strict';

  function isValidQuery(meta, query){
    if (query && Array.isArray(query.must)){
      var queryComponentCheck = true;
      query.must.forEach(function(queryItem){
        var queryConfig = queryItem.term || queryItem.range;
        queryComponentCheck = queryComponentCheck && meta[queryConfig.field];
      });
      return queryComponentCheck;
    } else {
      return false;
    }
  }

  function addBoolQuery(query){
    var meta = this._meta;
    if (isValidQuery(meta, query)) {
      console.log('Valid bool_query');
      this._params.bool_query = query;
    } else {
      console.warn('Invalid bool_query');
    }
  }

  function removeBoolQuery(){
    this._params.bool_query = null;
    delete this._params.bool_query;
  }

  function getBoolQuery(){
    return this._params.bool_query;
  }

  module.exports = {
    addBoolQuery : addBoolQuery,
    removeBoolQuery : removeBoolQuery,
    getBoolQuery : getBoolQuery
  };
}());
