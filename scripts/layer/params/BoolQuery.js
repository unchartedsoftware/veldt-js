(function(){

  'use strict';

  var checkField = function(meta, field) {
    if (meta && meta.type) {

    }
  }

  function addBoolQuery(query){

    // do some validation on the query object
    // e.g. make sure that all of the fields referenced are actually part of the metadata for the layer
    this.boolQuery = query;
    console.log('adding forreals');
    return {};
  }

  function removeBoolQuery(){
    this.boolQuery = null;
    console.log('removing forreals');
    return {};
  }

  function getBoolQuery(){

    console.log('getting forreals');
    return this.boolQuery;
  }

  module.exports = {
    addBoolQuery : addBoolQuery,
    removeBoolQuery : removeBoolQuery,
    getBoolQuery : getBoolQuery
  }
}());
