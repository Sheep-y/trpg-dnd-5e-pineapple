/*
 * sparrow_data.js
 *
 * Data module for Sparrow library.
 */

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