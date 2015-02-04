/*
 * sparrow_data.js
 *
 * Data module for Sparrow library.
 */
var Symbol;

( function _data_init ( _ ) { 'use strict';

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
_.Index = {
   "create" : function ( indices ) {
      var me = _.newIfSame( this, _.EventManager );
      if ( indices === undefined || ! ( Array.isArray( indices ) ) || indices.length <= 0 )
         throw "[Sparrow] Index(): Invalid parameter, must be array of fields to index.";
      me.all = [];
      me.map = {};
      for ( var i = 0, l = indices.length ; i < l ; i++ ) {
         me.map[ indices[ i ] ] = {};
      }
      return me;
   },
   "all" : [],
   "map" : {},

   /**
    * Add an object and update index.
    *
    * @param {Object} obj Object to add
    */
   "add" : function ( obj ) {
      var map = this.map;
      for ( var i in map ) {
         var index = map[ i ], keys = _.array( obj[ i ] );
         keys.forEach( function _Index_add_each( key ) {
            key = "" + key;
            var list = index[ key ];
            if ( list === undefined ) index[ key ] = list = [];
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
   "remove" : function ( obj ) {
      var map = this.map, pos = this.all.indexOf( obj );
      if ( pos < 0 ) return;
      this.all.splice( pos, 1 );
      for ( var i in map ) {
         var index = map[ i ], keys = _.array( obj[ i ] );
         keys.forEach( function _Index_remove_each( key ) {
            key = "" + key;
            var list = index[ key ];
            if ( list.length === 1 ) {
               delete index[ key ];
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
   "get" : function ( criteria ) {
      if ( criteria === undefined ) return this.all.concat();
      var map = this.map, results = [];
      for ( var i in criteria ) { // Build candidate list for each criterion
         var index = map[i], criterion = criteria[i];
         if ( index === undefined ) throw "[Sparrow] Index.get(): Criteria not indexed: " + i;
         // Convert integer range to bounded list
         if ( typeof( criterion ) === 'object' && ( criterion['>='] || criterion['<='] ) ) {
            var range = [], lo = ~~criterion['>='], hi = ~~criterion['<='];
            if ( lo <= hi ) {
               for ( var k = lo ; k <= hi ; k++ )
                  range.push( ""+k );
            }
            criterion = range;
         }
         if ( Array.isArray( criterion ) ) {
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

/**
 * A composite object provides the base of a hierarchical structure .
 * It support iterator, provides method for navigation, and has observer with consolidated event.
 */
_.Composite = {
   'create' : function ( ) {
      var me = _.newIfSame( this, _.Composite );
      me._parent = me._children = me._observers = null;
      return me;
   },

   '_parent' : null,
   '_children' : null, // Array, either null or non-empty.  Never empty array.
   '_observers' : null,

   'fireStrutureChanged' : function ( newNodes, oldNodes ) {
      this.fireObserver( 'structure', { 'target': this, 'type': 'structure', 'newNodes': _.ary( newNodes ), 'oldNodes': _.ary( oldNodes ) } );
   },
   'fireAttributeChanged' : function ( name, newValue, oldValue ) {
      this.fireObserver( 'attribute', { 'target': this, 'type': 'attribute', 'name': name, 'newValue': newValue, 'oldValue': oldValue } );
   },
   'fireObserver' : function ( type, event ) {
      if ( this._observers ) this._observers.fire( type, event );
      if ( this._parent ) this._parent.fireObserver( type, event );
   },

   'addObserver' : function ( type, observer ) {
      if ( ! this._observers ) {
         this._observers = _.EventManager.create( [ 'structure', 'attribute' ], this );
         this._observers.deferred = true;
      }
      this._observers.add( type, observer );
   },

   'removeObserver' : function ( type, observer ) {
      if ( ! this._observers ) return;
      this._observers.remove( type, observer );
      if ( this._observers.isEmpty() ) this._observers = null;
   },

   'add' : function ( components ) {
      var comp = _.array( components ), me = this;
      if ( comp.length <= 0 ) return;
      var c = this._children || ( this._children = [] );
      comp.forEach( function _Composite_add ( e ) {
         var parent = e.getParent();
         _.assert( parent !== me, '[sparrow.Composite] Cannot re-add to parent.' );
         if ( parent ) parent.remove( e );
         e._parent = me;
         e.fireAttributeChanged( 'parent', me, parent );
         c.push( e );
      } );
      this.fireStrutureChanged( comp, null );
   },

   'remove' : function ( components ) {
      var comp = _.array( components ), c = this._children, me = this;
      if ( comp.length <= 0 ) return;
      _.assert( c && c.length, '[sparrow.Composite] Cannot remove without children' );
      comp.forEach( function _Composite_remove ( e ) {
         var pos = c.indexOf( e );
         _.assert( e.getParent() === me && pos >= 0, '[sparrow.Composite] Cannot remove non-existing children' );
         e._parent = null;
         e.fireAttributeChanged( 'parent', null, me );
         c.splice( pos, 1 );
      } );
      if ( c.length <= 0 ) this._children = null;
      this.fireStrutureChanged( null, comp );
   },

   'iterator' : function ( ) {
      var stack = [ this ];
      return {
         'next' : function _Composite_iterator_next ( ) {
            if ( stack.length === 0 ) return { 'done': true };
            var value = stack.shift();
            if ( value.childrenCount ) stack = value.children.concat( stack );
            return { 'value': value };
         }
      };
   },

   get childrenCount ( ) { return this._children ? this._children.length : 0; },
   get children ( ) { return this._children ? this._children.concat() : []; },
   set children ( child ) {
      child = _.array( child );
      if ( this._children ) {
         this.remove( this._children.filter( function ( c ) { return child.indexOf( c ) < 0; } ) );
         this.add   ( child.filter( function ( c ) { return this._children.indexOf( c ) < 0; } ) );
      } else {
         this.add( child );
      }
      this._children = child.concat(); // Set children order
   },
   'getRoot' : function ( type ) {
      if ( type ) {
         var result = this === type || type.isPrototypeOf( this ) ? this : null;
         if ( this._parent ) result = this._parent.getRoot( type ) || result;
         return result;
      }
      if ( ! this._parent ) return this;
      return this._parent.getRoot();
   },
   'getParent' : function ( type ) {
      if ( type ) {
         if ( this === type || type.isPrototypeOf( this ) ) return this;
         if ( this._parent ) return this._parent.getParent( type );
      }
      return this._parent;
   },

   'recur' : function ( pre, leaf, post, parent ) {
      var c = this._children;
      if ( c ) {
         if ( pre ) pre.call( this, this );
         for ( var i = 0, l = c.length ; i < l ; i++ )
            c[i].recur( pre, leaf, post, this );
         if ( post ) post.call( this, this );
      } else {
         if ( leaf ) leaf.call( this, this );
      }
   }
};

if ( Symbol && Symbol.iterator ) _.Composite[ Symbol.iterator ] = _.Composite.prototype.iterator;

} )( _ );