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

var sys = ns.sys = _.map();

/**
 * A bonus is part of a value, who knows its own source and type and status.
 */
sys.Bonus = {
   'create' ( value, source, type ) {
      var me = _.newIfSame( this, sys.Bonus );
      me.value = value;
      if ( source ) me.source = source;
      if ( type ) me.type = type;
      return me;
   },
   'source' : null,
   'value'  : 0,
   'type'   : undefined,
   'inactive' : false, // Active bonus will contribute to a Value's final value.
   'toString' () {
      var str = sys.formatBonus( this.value );// + ' ' + ( this.source || '' );
      return str + this.inactive ? '[Inactive]' : '';
   },
};

sys.formatBonus = function dd5_formatBonus ( val ) {
   return ( val < 0 ? '' : '+' ) + val;
};

/**
 * A value composed of bonus. Call value() to resolve and get value.
 */
sys.Value = {
   'create' ( base_bonus ) {
      var me = _.newIfSame( this, sys.Value );
      me.boni = [];
      if ( base_bonus ) me.add( base_bonus );
      return me;
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
      var me = _.newIfSame( this, sys.Query );
      me.query = query;
      me.whoask = whoask;
      me.value = value;
      me.cause = cause;
      return me;
   },
   'query'   : '',          // Query key
   'whoask'  : null,       // Who formed this query
   'value'   : undefined, // Return value
   'cause'   : null,     // Original query
   'valueOf' ( ) {
      var val = this.value;
      if ( Array.isArray( val ) )
      while ( _.is.object( val ) && typeof( val.valueOf ) === 'function' ) {
         val = val.valueOf();
      }
      return val;
   },
   'toString' ( ) {
      return '' + this.valueOf();
   },

   'add_bonus' ( bonus, source, type ) {
      return this.add_result( bonus, ( e ) => {
         var value = parseFloat( e );
         if ( isNaN( value ) ) {
            return log.warn( `Unknown bonus ${bonus} from ${source}, cannot add bonus to ${ this.query } query.` );
         }
         value = sys.Bonus.create( value, source, type );
         if ( this.value === undefined )
            this.value = sys.Value.create( value );
         else if ( sys.Value.isPrototypeOf( this.value ) )
            this.value.add( value ); // Bonus should not duplicate, if duplicate it is design error
         else
            log.warn( `Unknown query result for ${ this.query }, cannot add bonus to query .` );
      } );
   },
   'add_result' ( entity, add ) {
      if ( add === undefined ) add = ( e ) => {
         if ( ! e ) return;
         if ( this.value === undefined ) {
            this.value = e;
         } else if ( Array.isArray( this.value ) ) {
            if ( this.value.indexOf( e ) < 0 ) this.value.push( e );
         } else {
            this.value = [ this.value ].concat( e );
         }
      }
      if ( Array.isArray( entity ) ) entity.forEach( add );
      else add( entity );
      return this;
   },
   'add_prof' ( entity ) {
      return this.add_result( entity, ( e ) => {
         if ( ! e ) return;
         if ( this.value === undefined ) {
            this.value = [ e ];
         } else if ( Array.isArray( this.value ) ) {
            if ( this.value.indexOf( e ) < 0 ) this.value.push( e );
         } else {
            log.warn( `Unknown query result for ${ this.query }, cannot add proficiency to query.` );
         }
      } );
   },
};

/**
 * An option may be compatible with a slot, but is otherwise invalid because of additional rules.
 */
sys.Option = {
   'create' ( value ) {
      var me = _.newIfSame( this, sys.Option );
      me.value = value;
      return me;
   },
   'valid' : true, // Is this a valid option, rule-wise?
   'group' : null, // Option group
   'note' : '',    // Any additional notes, such as suggested reason or invalid reason
   'toString' () {
      return value.toString();
   },
};


/**
 * A composite object. It has logic critical to the dd5 system.
 *
 * A character generator can have up to tens of thousands of composites.
 */
sys.Composite = {
   '__proto__' : _.Composite,
   'create' ( opt ) {
      var me = _.newIfSame( this, sys.Composite );
      _.Composite.create.call( me );
      if ( ! opt ) return me;
      if ( opt.id ) me.id = opt.id;
      if ( opt.cid ) me.cid = opt.cid;
      if ( opt.name ) me.name = opt.name;
      if ( opt.parent ) opt.parent.add( me );
      return me;
   },
   'id' : undefined, // string
   'cid' : undefined, // component id

   'getPath' ( root ) {
      var p = this.getParent();
      var myid = this.id;
      if ( ! myid ) myid = p ? p.children.indexOf( this ) : 'headless';
      if ( ! p || this === root ) return myid;
      return p.getPath( root ) + '.' + myid;
   },

   'getName' ( ) {
      if ( this.cid ) return _.l( 'dd5.' + this.cid, this.name || this.cid );
      return _.coalesce( this.name, this.id );
   },
   'getDesc' ( ) {
      if ( ! this._children ) return '';
      var result = '';
      this.recur( null, ( node ) => result += node.getDesc(), null );
      return result;
   },
   'getLabel' ( ) {
      return this.id ? _.l( 'dd5.attribute.' + this.id ) : _.coalesce( this.cid, this.getPath() );
   },
   'toString' ( ) {
      return this.getName();
   },

   'getCharacter' ( ) { return this.getRoot( ns.rule.Character ); },
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

ns.res = _.map();
ns.res.new = function dd5_res_new ( name ) {
   return ns.res[ name ] || ( ns.res[ name ] = Catalog.create() );
}

var Catalog = {
   'create' () {
      var me = _.newIfSame( this, Catalog );
      me._list = [];
      return me;
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
            if ( Array.isArray( criteron ) ) {
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
               filter = ( e ) => { return criteron === "" + ( e[i] !== undefined ? e[i] : undefined ); };
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

sys.toCId = ( data ) => _.flatten( _.array( data ).map( e => [ e.cid, e.cid.split('.').pop() ] ) );

pinbun.event.load( 'dd5' );

})( dd5 = _.map() );