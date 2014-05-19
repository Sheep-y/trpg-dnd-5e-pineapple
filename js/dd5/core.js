'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( ! dd5, '5e core module already loaded.' );

var dd5 = {};

(function dd5_core_init ( ns ){

var l10n = 'dd5.';
var error_core = '[dd5] ';

ns.event = new _.EventManager( [ 'error', 'warn' ], ns );
ns.warn = function dd5_warn ( msg ) { ns.event.fire( 'warn', msg ); }
ns.error = function dd5_error ( msg ) { ns.event.fire( 'error', msg ); };

ns.event.add( 'warn', function dd5_error_handler_console ( msg ) { _.warn( msg ); } );
ns.event.add( 'error', function dd5_error_handler_console ( msg ) { _.error( msg ); } );

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

   query : function dd5_Composite_query ( query, source ) {
      var that = this;
      this.getChildren().forEach( function dd5_Component_query_each ( e ) { try {
         if ( ! source && ! e.l10n ) source = this;
         e.query( query, source );
      } catch ( ex ) {
         if ( ! that.l10n ) throw ex;
         ns.error( error_core + "Error when querying '" + e.type + "' in " + that.l10n + ':\n' + ex );
      } } );
      return query;
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

   query : function dd5_Component_query ( query ) {
      this.res_template.query( query );
      return sys.Composite.prototype.query.call( this, query );
   }
});

sys.Character = _.inherit( sys.Component, function dd5_Character( template ) {
   sys.Component.call( this, template );
}, {
   query : function dd5_Character_query ( query ) {
      if ( typeof( query ) === 'string' ) query = { query: query };
      if ( ! query.you ) query.you = this;
      return sys.Component.prototype.query.call( this, query );
   }
});

})( dd5 );