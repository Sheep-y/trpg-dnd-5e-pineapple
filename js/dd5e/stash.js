'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

var dd5e = {};

(function( ns ){

var l10n = 'dd5e.';

var sys = ns.Sys = {};

/** A bonus. */
sys.Bonus = function dd5e_Bonus ( source, value, type ) {
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
   toString : function dd5e_Bonus_toString () { 
      var str = ( this.value < 0 ? '' : '+' ) + this.value;
      if ( this.source ) str += ' ' + this.source;
      if ( this.active !== true )
         str += _.l( l10n+'bonus.inactive' + (this.active !== false ? '2' : '' ), '[Inactive]', this.active );
      return str;
   }
};


/** A value composed of bonus. Call value() to resolve and get value. */
sys.Value = function dd5e_Value ( base_bonus ) {
   this.boni = base_bonus ? [ base_bonus ] : [];
};
sys.Value.prototype = {
   boni: [], // Bonus stack
   add : function dd5e_Value_add ( bonus ) {
      this.boni.push( bonus );
   },
   remove : function dd5e_Value_remove ( bonus ) {
      this.boni.splice( this.boni.indexOf( bonus ), 1 );
   },
   value : function dd5e_Value_value () {
      return boni.reduce( function dd5e_Value_getValue_reduce( v, e, i ) {
         if ( ! e || e.active !== true ) return v;
         return ( v === undefined ? 0 : v ) + e.value;
      } );
   },
   toString : function dd5e_Value_value () {
      var v = this.value();
      var list = this.boni.filter( function(e){ return e.active === true; });
      return v + ' (' + list.join( ' ' ).replace( /^\+/, '' ) + ')';
   }
};

/**
 * A character component. Such as a race, a feat, or a class feature effect.
 */
sys.Component = function dd5e_Component ( classification, id, triggers ) {
   if ( this.classification ) this.classification = classification;
   if ( this.id ) this.id = id;
   this.keys = triggers ? _.toAry( triggers ) : [];
   this.children = [];
};
_.l( l10n + '.undefined.undefined', '(Unnamed)' );
sys.Component.prototype = {
   classification : undefined, // string
   id : undefined, // string
   parent : null,
   children: [],

   keys: [], // Name of modifying queries

   getName : function dd5e_Component_getName ( ) {
      return this.name ? this.name : _.l( l10n + this.classification + '.' + this.id, this.id );
   },
   toString : function dd5e_Component_toString ( ) { return this.getName(); },
   
   triggers : function dd5e_Component_query_triggers() { return this.keys; },

   effect : function dd5e_Component_modify ( query ) {},

   add : function dd5e_Component_add ( comp ) {
      if ( comp.parent === this ) return this;
      if ( comp.parent ) comp.parent.remove( comp );
      this.children.push( comp );
      comp.parent = this;
      comp.hook( this.getRoot() );
   },

   remove : function dd5e_Component_remove ( comp ) {
      var pos = this.children.indexOf( comp );
      _.assert( comp.parent === this && pos >= 0 );
      comp.unhook( this.getRoot() );
      comp.parent = null;
      this.children.splice( pos, 1 );
   }, 

   recur : function dd5e_Component_recur( func ) {
      func.call( this );
      if ( this.children )
         for ( var i = 0, l = this.children.length ; i < l ; i++ )
            this.childres[i].recur( func );
   },

   clone : function dd5e_Component_clone( keep_parent ) {
      var result = {};
      result.prototype = this.prototype;
      for ( var k in this )
         result[k] = this[k] instanceof Array ? this[k].concat() : this[k];
      result.children = result.children.map( function dd5e_Component_clone_children(e){
         return e.clone( true ); } );
      if ( result.options )
         result.options = result.options.map( function dd5e_Component_clone_options(e){
            return e.clone ? e.clone( true ) : e; } );
      if ( ! keep_parent ) result.parent = null;
      return result;
   },

   hook : function dd5e_Component_hook( root ) {
      this.recur( function(){ root.registerModification( this.modifiers(), this ); });
   }, 
   unhook : function dd5e_Component_unhook( root ) {
      this.recur( function(){ root.unregisterModification( this.modifiers(), this ); });
   }, 

   getRoot : function dd5e_Component_getRoot ( ) {
      return this.parent ? this.parent.getRoot() : this;
   },
};

sys.Character = _.inherit( sys.Component, function dd5e_Character() {
   this.register = new _.EventManager( this );
}, {
   register : null, // _.EventManager
   registerModification : function dd5e_Character_registerModification( mods, mod ) {
      this.register.add( mods, mod );
   },
   unregisterModification : function dd5e_Character_registerModification( mods, mod ) {
      this.register.remove( mods, mod );
   },
   modify : function dd5e_Character_modify( query ) {
      if ( typeof( query ) === 'string' ) query = { type: query };
      var type = query.type, lst = this.register.lst;
      if ( lst[ type ] ) {
         lst = lst[ type ];
         for ( var i = 0, l = lst.length ; i < l ; i++ )
            lst[i].modify( type, query );
      }
      return query;
   },
});

})( dd5e );