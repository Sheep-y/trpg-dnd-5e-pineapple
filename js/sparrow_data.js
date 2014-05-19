/*
 * sparrow_data.js
 *
 * Data module for Sparrow library.
 */

/**
 * Keep an index on specified object fields (field value can be undefined)
 * and enable simple seeking of objects that fulfill one or more criterias.
 *
 * Indexed fields are not expected to change frequently; the object need to be
 * removed before the change and re-added after the change.
 *
 * Indexed object's field values can be array, and each values will be indexed.
 *
 * @constructor
 * @param {Array} indices Array of name of fields to index.
 * @returns {_.Index} Index object
 */
_.Index = function _Index ( indices ) {
   if ( indices === undefined || ! ( indices instanceof Array ) || indices.length <= 0 )
      throw "[Sparrow] Index(): Invalid parameter, must be array of fields to index.";
   this.all = [];
   this.map = {};
   for ( var i = 0, l = indices.length ; i < l ; i++ ) {
      this.map[ indices[i] ] = {};
   }
};
_.Index.prototype = {
   "all" : [],
   "map" : {},
   /**
    * Add an object and update index.
    *
    * @param {Object} obj Object to add
    */
   "add" : function _Index_add ( obj ) {
      var map = this.map;
      for ( var i in map ) {
         var index = map[i], keys = _.toAry( obj[i] );
         keys.forEach( function _Index_add_each( key ) {
            key = "" + key;
            var list = index[key];
            if ( list === undefined ) index[key] = list = [];
            list.push( obj );
         } );
      }
      this.all.push( obj );
   },
   /**
    * Remove an object and update index.
    *
    * @param {Object} obj Object to remove
    */
   "remove" : function _Index_remove ( obj ) {
      var map = this.map, pos = this.all.indexOf( obj );
      if ( pos < 0 ) return;
      this.all.splice( pos, 1 );
      for ( var i in map ) {
         var index = map[i], keys = _.toAry( obj[i] );
         keys.forEach( function _Index_remove_each( key ) {
            key = ""+key;
            var list = index[key];
            if ( list.length === 1 ) {
               delete index[key];
            } else {
               list.splice( list.indexOf( obj ), 1 );
            }
         } );
      }
   },
   /**
    * Search the index to get a list of objects.
    *
    * Each search criterion is normally a string, returned objects will be an exact match in that field.
    * Alternatively, search criterion can be an array of string, for objects that exactly match any of them.
    * A criterion can also be a bounded integer range e.g. { '>=': 1, '<=': 9 } (missing = 0).
    *
    * For more advanced processing, please manually pre-process on index to get the correct filter.
    *
    * @param {Object} criteria An object with each criterion as a field. If unprovided, return a list of all indiced object.
    * @returns {Array} List of objects that meet all the criteria.
    */
   "get" : function _Index_get ( criteria ) {
      if ( criteria === undefined ) return this.all.concat();
      var map = this.map, results = [];
      for ( var i in criteria ) { // Build candidate list for each criterion
         var index = map[i], criterion = criteria[i];
         if ( index === undefined ) throw "[Sparrow] Index.get(): Criteria not indexed: " + i;
         // Convert integer range to bounded list
         if ( criterion instanceof Object && ( criterion['>='] || criterion['<='] ) ) {
            var range = [], lo = ~~criterion['>='], hi = ~~criterion['<='];
            if ( lo <= hi ) {
               for ( var k = lo ; k <= hi ; k++ )
                  range.push( ""+k );
            }
            criterion = range;
         }
         if ( criterion instanceof Array ) {
            // Multiple target values; regard as 'OR'
            var buffer = [], terms = [];
            for ( var j = 0, cl = criterion.length ; j < cl ; j++ ) {
               var val = "" + criterion[j], list = index[val];
               if ( list === undefined || terms.indexOf( val ) >= 0 ) continue;
               buffer = buffer.concat( list ); // Each list should contains unique objects!
               terms.push( val );
            }
            if ( buffer.length <= 0 ) return [];
            results.push( buffer );
         } else {
            // Single target value.
            var val = "" + criterion, list = index[val];
            if ( list === undefined ) return [];
            results.push( list );
         }
      }
      // No result, e.g. criteria is empty. Return empty.
      if ( results.length <= 0 ) return [];
      // Single criterion, return single list.
      if ( results.length === 1 ) return results[0];
      // We have multiple criteria list, find intersection. Start with shortest list.
      results.sort( function(a,b){ return a.length - b.length; } );
      var result = results[0].concat();
      for ( var i = result.length-1 ; i >= 0 ; i-- ) { // For each candidate
         var obj = result[i];
         for ( var j = 1, rl = results.length ; j < rl ; j++ ) { // Check whether it is in each other list
            if ( results[j].indexOf( obj ) < 0 ) {
               result.splice( i, 1 );
               break;
            }
         }
      }
      return result;
   }
};

_.tree = function _tree( fields, data ) {
   if ( data === undefined && fields instanceof Array ) {
      data = fields;
      fields === undefined;
   }


};

_.tree.parseFilter = function _tree_parseFilter( filter ) {
   if ( typeof( filter ) != 'string' ) return filter;
   var result = {};
};

_.tree.base = function _data_base( base, data ) {
   this._base = base;
   this._data = data;
};
_.tree.base.prototype = {
   _base: null,
   _data: [],
   select: function _data_select( filter ) {
      var pool = this._data;
      filter = _.tree.parseFilter( filter );
   },
   insert: null,
   delete: null,
   update: null,
   truncate: function _data_truncate() {
      this._data = [];
   }
};