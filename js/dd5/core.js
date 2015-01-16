var pinbun, dd5; // Globals
if ( ! pinbun ) throw new Error( '[dd5] Pineapplebun must be loaded first.' );
else if ( ! dd5 ) ( function dd5_core_init ( ns ) { 'use strict';

ns.systemId = 'DD/5.0';

var mainlog = pinbun.event;
var log = ns.event = _.EventManager.create( [ 'error', 'warn', 'info', 'fine', 'finer', 'finest' ], ns );
ns.event.createFireMethods();

log.add( 'error', mainlog.error );
log.add( 'warn' , mainlog.warn );
log.add( 'info', mainlog.info );
log.add( 'fine', mainlog.fine );
log.add( 'finer', mainlog.finer );
log.add( 'finest', mainlog.finest );

var sys = ns.sys = Object.create( null );

/**
 * A bonus is part of a value, who knows its own source and type and status.
 */
sys.Bonus = {
   'create' ( value, source, type ) {
      var that = _.newIfSame( this, sys.Bonus );
      that.value = value;
      if ( source ) that.source = source;
      if ( type ) that.type = type;
      return that;
   },
   'source' : null,
   'value'  : 0,
   'type'   : undefined,
   'inactive' : false, // Active bonus will contribute to a Value's final value.
   'toString' () {
      var str = sys.formatBonus( this.value );// + ' ' + ( this.source || '' );
      return str + this.inactive ? '[Inactive]' : '';
   }
};

sys.formatBonus = function dd5_formatBonus ( val ) {
   return ( val < 0 ? '' : '+' ) + val;
}

/**
 * A value composed of bonus. Call value() to resolve and get value.
 */
sys.Value = {
   'create' ( base_bonus ) {
      var that = _.newIfSame( this, sys.Value );
      that.boni = [];
      if ( base_bonus ) that.add( base_bonus );
      return that;
   },
   'boni' : [], // Bonus stack
   'add' ( bonus ) {
      this.boni.push( bonus );
   },
   'remove' ( bonus ) {
      this.boni.splice( this.boni.indexOf( bonus ), 1 );
   },
   'getDesc' ( ) {
      var v = this.valueOf();
      if ( this.boni.length ) {
         var list = this.boni.filter( e => ! e.inactive );
         v += ' (' + list.join( ' ' ).replace( /^\+/, '' ) + ')';
      }
      return v;
   },
   'valueOf' ( ) {
      if ( this.boni.length === 0 ) return undefined;
      var result = this.boni.reduce( ( v, e, i ) => {
         if ( ! e || e.inactive ) return v;
         return ( v === undefined ? 0 : v ) + e.value;
      }, undefined );
      return result;
   },
   'toString' ( ) {
      return this.valueOf();
   },
};

/**
 * A query context
 *
 * @param {string} query Query key
 * @returns {dd5_core_init.dd5_Query}
 */
sys.Query = {
   'create' ( query, whoask, value, cause ) {
      var that = _.newIfSame( this, sys.Query );
      that.query = query;
      that.whoask = whoask;
      that.value = value;
      that.cause = cause;
      return that;
   },
   'query'   : '',          // Query key
   'whoask'  : null,       // Who formed this query
   'value'   : undefined, // Return value
   'cause'   : null,     // Original query
   'valueOf' ( ) {
      var val = this.value;
      while ( _.is.object( val ) && typeof( val.valueOf ) === 'function' ) {
         val = val.valueOf();
      }
      return val;
   },
   'toString' ( ) {
      return '' + this.valueOf();
   },
};

/**
 * A composite object. It is the shared base of components and rules.
 *
 * A character generator can have up to tens of thousands of composites.
 */
sys.Composite = {
   '__proto__' : _.Composite,
   'create' ( opt ) {
      var that = _.newIfSame( this, sys.Composite );
      _.Composite.create.call( that );
      if ( ! opt ) return that;
      if ( opt.id ) that.id = opt.id;
      if ( opt.cid ) that.cid = opt.cid;
      if ( opt.name ) that.name = opt.name;
      if ( opt.parent ) opt.parent.add( that );
      return that;
   },
   'id' : undefined, // string
   'cid' : undefined, // component id

   'getPath' ( root ) {
      var p = this.getParent();
      var myid = this.id;
      if ( ! myid ) myid = p ? '#' + p.children.indexOf( this ) : '?';
      if ( ! p || this === root ) return myid;
      return p.getPath( root ) + '/' + myid;
   },

   'getName' ( ) {
      if ( this.cid ) return _.l( 'dd5.' + this.cid, this.name || this.cid );
      return _.coalesce( this.name, this.id );
   },
   'getDesc' ( ) {
      if ( ! this._children ) return '';
      var result = '';
      this.recur( null, function dd5_Composite_getDesc_recur() { result += this.getDesc(); }, null );
      return result;
   },
   'toString' () {
      return this.getName();
   },

   'getCharacter' ( ) { return this.getParent( ns.rule.Character ); },
   'getResource' ( ) { return this.getParent( ns.rule.Resource ); },

   'createUI' ( type, container ) { return ns.ui.createUI( this, type, container ); },

   'query' ( query ) {
      for ( var e of this.children ) try {
         e.query( query );
      } catch ( ex ) {
         if ( ! this.cid ) throw ex;
         log.error( `Error when querying "${ query.query }" of ${ e.getPath() }.`, ex );
      }
      return query;
   },

   'queryChar' ( key, whoask, value, cause ) {
      var c = this.getCharacter();
      if ( c ) return c.query( sys.Query.create( key, whoask, value, cause ) ).value;
      return value;
   },
};

/*************************** Resource Catalogs *******************************/

ns.res = Object.create( null );
ns.res.new = function dd5_res_new ( name ) {
   return ns.res[ name ] || ( ns.res[ name ] = Catalog.create() );
}

var Catalog = {
   'create' () {
      var that = _.newIfSame( this, Catalog );
      that._list = [];
      return that;
   },
   '_list' : null,
   'add' ( item ) {
      this._list.push( item );
   },
   'remove' ( item ) {
      this._list.splice( this._list.indexOf( item ), 1 );
   },
   // find( { 'level': { '>=': 4, '<=': 6 },
   //         'freq' : [ 'daily', 'at-will' ] } )
   'get' ( criteria ) {
      if ( typeof( criteria ) === 'string' ) criteria = { 'id' : criteria }; // We can do optimisation later
      var result = this._list.concat();
      if ( criteria ) {
         for ( var i in criteria ) {
            var criteron = criteria[i], filter;
            if ( criteron instanceof Array ) {
               // List match
               filter = ( e ) => criteron.indexOf( e[i] ) >= 0;
            } else if ( typeof( criteron ) === 'object' ) {
               // Range match
               var lo = criteron['>='], hi = criteron['<='];
               filter = ( e ) => {
                  var val = +e[i];
                  if ( isNaN( val ) ) return false;
                  if ( lo !== undefined && val < lo ) return false;
                  if ( hi !== undefined && val > hi ) return false;
                  return true;
               };
            } else {
               // Plain value match
               criteron += "";
               filter = ( e ) => { return criteron === ""+e[i]; };
            }
            result = result.filter( filter );
            if ( result.length <= 0 ) break;
         }
      }
      return result;
   }
};

/** In-system Resources */
[ "source", "entity", "character", "feature",
  "race", "skill", "background", "class", "equipment",
  "feat", "spell_list", "spell" ].forEach( ns.res.new );

pinbun.event.load( 'dd5' );

})( dd5 = Object.create( null ) );