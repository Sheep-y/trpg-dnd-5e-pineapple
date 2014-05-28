'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( ! dd5, '5e core module already loaded.' );

var dd5 = {};

(function dd5_core_init ( ns ){

var l10n = 'dd5.';
var error_core = '[dd5] ';

ns.event = new _.EventManager( [ 'error', 'warn' ], ns );
ns.event.createFireMethods( [ 'error', 'warn' ] );

ns.event.add( 'warn', function dd5_onwarn_console ( msg ) { _.warn( msg ); } );
ns.event.add( 'error', function dd5_onerror_console ( msg ) { _.error( msg ); } );

var sys = ns.sys = {};

/**
 * An expression can stand in anywhere a complex expression is expected.
 *
 * @constructor
 * @param {object} value  Any value, can be string, number, array etc.
 * @returns {Expression}
 */
sys.Expression = function dd5_Expression ( value ) {
   this.value = value;
};
sys.Expression.prototype = {
   eval : function dd5_Expression_toDesc ( context ) { return this.value; },
   getDesc : function dd5_Expression_toDesc () { return this.value; },
   toString : function dd5_Expression_toString () { return this.value; }
};

/** A bonus. */
sys.Bonus = function dd5_Bonus ( source, value, type ) {
   this.source = source;
   this.value = value;
   if ( type ) this.type = type;
};
_.l.set( l10n + 'bonus', { 'inactive' : ' [Inactive]', 'inactive2' : ' [Inactive: %1]' } );
sys.Bonus.prototype = {
   source: null,
   value: 0,
   type: undefined,
   active: true, // Active bonus will contribute to a Value's final value.
   toString : function dd5_Bonus_toString () {
      var str = ( this.value < 0 ? '' : '+' ) + this.value;
      if ( this.source ) str += ' ' + this.source;
      if ( this.active !== true )
         str += _.l( l10n+'bonus.inactive' + (this.active !== false ? '2' : '' ), '[Inactive]', this.active );
      return str;
   }
};


/** A value composed of bonus. Call value() to resolve and get value. */
sys.Value = function dd5_Value ( base_bonus ) {
   this.boni = base_bonus ? [ base_bonus ] : [];
};
sys.Value.prototype = {
   boni: [], // Bonus stack
   add : function dd5_Value_add ( bonus ) {
      this.boni.push( bonus );
   },
   remove : function dd5_Value_remove ( bonus ) {
      this.boni.splice( this.boni.indexOf( bonus ), 1 );
   },
   value : function dd5_Value_value () {
      if ( this.boni.length === 0 ) return undefined;
      return this.boni.reduce( function dd5_Value_getValue_reduce( v, e, i ) {
         if ( ! e || e.active !== true ) return v;
         return ( v === undefined ? 0 : v ) + e.value;
      }, undefined );
   },
   toString : function dd5_Value_value () {
      var v = this.value();
      if ( this.boni.length ) {
         var list = this.boni.filter( function(e){ return e.active === true; });
         v += ' (' + list.join( ' ' ).replace( /^\+/, '' ) + ')';
      }
      return v;
   }
};

sys.Query = function dd5_Query ( query ) {
   this.query = query;
   this.source = [];
};
sys.Query.prototype = {
   template : undefined, // Set to true or false by first caller.
   value : undefined,  // Return value
   you : undefined,  // A common property
   _source : []    // First element is latest source.
};

/**
 * A composite object. It is the shared base of components and tempalates.
 *
 * 4e CG can have tens of thousands of composite, before compilation.
 */
sys.Composite = function dd5_Composite ( id ) {
   if ( id ) this.id = id;
};
sys.Composite.prototype = {
   id : undefined, // string
   l10n : undefined, // key to get localised name; also serves as a unique id
   _parent : null,
   _children: null, // Array, either null or non-empty.  Nevew empty array.

   getName : function dd5_Composite_getName ( ) {
      return this.l10n ? _.l( l10n + this.l10n, this.name ) : ( this.name ? this.name : this.id );
   },
   getDesc : function dd5_Composite_getDesc (  ) {
      if ( ! this._children ) return '';
      var result = '';
      this.recur( null, function dd5_Composite_getDesc_recur() { result += this.getDesc(); }, null );
      return result;
   },

   add : function dd5_Composite_add ( comp ) {
      var parent = comp.getParent(), c = this._children; // Don't use getChildren, we need to know if it is null
      _.assert( parent !== this, 'Cannot re-add to parent.' );
      if ( parent ) parent.remove( comp );
      comp._parent = this;
      if ( c ) {
         c.push( comp );
      } else {
         this._children = [ comp ];
      }
   },

   remove : function dd5_Composite_remove ( comp ) {
      var c = this._children, pos = c ? c.indexOf( comp ) : 0;
      _.assert( comp.getParent() === this && pos >= 0, 'Cannot remove non-existing children' );
      comp._parent = null;
      if ( c.length > 1 ) {
         c.splice( pos, 1 );
      } else {
         this._children = null;
      }
   },

   getChildren : function dd5_Composite_getChildren ( ) { return this._children ? this._children.concat() : []; },
   getParent : function dd5_Composite_getParent ( ) { return this._parent; },
   getRoot : function dd5_Composite_getRoot ( ) {
      return this.parent ? this.parent.getRoot() : this;
   },
   toString : function dd5_Composite_toString ( ) { return this.getName(); },

   query : function dd5_Composite_query ( query ) {
      if ( typeof query === 'string' )
         query = new sys.Query( query );
      query.template = ! ( this instanceof sys.Component );
      this._query( query );
      return query;
   },

   _query : function dd5_Composite__query ( query ) {
      var children = this.getChildren();
      if ( children.length <= 0 ) return; // If we have no children, don't border.

      var that = this;
      if ( this.l10n ) query._source.unshift( this );

      children.forEach( function dd5_Component_query_each ( e, i ) { try {
         e._query( query );
      } catch ( ex ) {
         if ( ! that.l10n ) throw ex;
         ns.event.error( error_core + "Error when querying '" + query.query + "' in " + that.l10n + '.' + i + '(' + e + '):\n' + ex );
      } } );

      if ( this.l10n ) query._source.shift();
   },

   recur : function dd5_Composite_recur( pre, leaf, post, parent ) {
      var c = this._children;
      if ( c ) {
         if ( pre ) pre.call( this, parent );
         for ( var i = 0, l = c.length ; i < l ; i++ )
            c[i].recur( pre, leaf, post, this );
         if ( post ) post.call( this, parent );
      } else {
         if ( leaf ) leaf.call( this, parent );
      }
   }

};

/**
 * A character component. Such as a race, a feat, or a class feature effect.
 */
sys.Component = _.inherit( sys.Composite, function dd5_Component ( template ) {
   sys.Composite.call( this );
   this.res_template = template;
   if ( template.l10n ) this.l10n = template.l10n;
}, {
   res_template : null,

   _query : function dd5_Component_query ( query ) {
      this.res_template._query( query );
      sys.Composite.prototype._query.call( this, query );
   }
});

sys.Character = _.inherit( sys.Component, function dd5_Character( template ) {
   sys.Component.call( this, template );
}, {
   _query : function dd5_Character_query ( query ) {
      if ( ! query.you ) query.you = this;
      sys.Component.prototype._query.call( this, query );
   }
});



var Catalog = _.inherit( null, function dd5__Catalog () {
   this._list = [];
}, {
   _list : null,
   add : function dd5__Catalog_add ( item ) { this._list.push( item ); },
   remove : function dd5__Catalog_remove ( item ) { this._list.splice( this._list.indexOf( item ), 1 ); },
   // find( { 'level': { '>=': 4, '<=': 6 },
   //         'freq' : [ 'daily', 'at-will' ] } )
   get : function dd5__Catalog_find ( criteria ) {
      // We can do optimisation later
      if ( typeof( criteria ) === 'string' ) criteria = { 'id' : criteria };
      var result = this._list.concat();
      if ( criteria ) {
         for ( var i in criteria ) {
            var criteron = criteria[i], filter;
            if ( criteron instanceof Array ) {
               // List match
               filter = function dd5_Catalog_find_list( e ) { return criteron.indexOf(　e[i] ) >= 0; };
            } else if ( typeof( criteron ) === 'object' ) {
               // Range match
               var lo = criteron['>='], hi = criteron['<='];
               filter = function dd5_Catalog_find_range( e ) {
                  var val = +e[i];
                  if ( isNaN( val ) ) return false;
                  if ( lo !== undefined && val < lo ) return false;
                  if ( hi !== undefined && val > hi ) return false;
                  return true;
               };
            } else {
               // Plain value match
               criteron += "";
               filter = function dd5_Catalog_find_text( e ) { return criteron === ""+e[i]; };
            }
            result = result.filter( filter );
            if ( result.length <= 0 ) break;
         }
      }
      return result;
   }
} );

/** In-system Resources */
ns.res = {
   "sourcebook": new Catalog(),
   "entity"    : new Catalog(),
   "character" : new Catalog(),
   "feature"   : new Catalog(),

   "race"      : new Catalog(),
   "skill"     : new Catalog(),
   "background": new Catalog(),
   "class"     : new Catalog(),
   "equipment" : new Catalog(),
   "feat"      : new Catalog(),
   "spell_list": new Catalog(),
   "spell"     : new Catalog()
};

})( dd5 );