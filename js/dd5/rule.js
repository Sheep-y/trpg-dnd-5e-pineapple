var dd5; // Globals
if ( ! dd5 ) throw new Error( '[dd5.rule] 5e core module must be loaded first.' );
else if ( ! dd5.rule ) ( function dd5_rule_init ( ns ) { 'use strict';

/**
 * Rules are the building blocks of system.
 * A spell, a equipment, a background, they are all Rule, as does actual system rules.
 *
 * @param {Object} ns Namespace object (dd5)
 */

var sys = ns.sys;
var res = ns.res;
var log = ns.event;

/****************** Helpers *******************/

var rule = ns.rule = _.map();

/** Wrap up object for easier use. */
rule.wrapper = {
   you ( target ) {
      var c = target ? target.getCharacter() : null;
      if ( ! c ) c = { query: _.echo, queryChar: _.dummy };
      return new Proxy( c, { // Divert unknown properties to query function
            'get' ( me, name ) {
               return name in me ? me[ name ] : me.query( sys.Query.create( name, me ) ).value;
            }
         } );
   },
   res : new Proxy( dd5.res, { // Repack categories as function
            'get' ( me, name ) {
               return name in me
                  ? criteria => rule.wrapper.first( me[ name ].get( criteria ) )
                  : null;
            }
         } ),
   first ( target ) {
      return new Proxy( target, { // if there is only one match, divert unknown properties to first result
         'get' ( me, name ) {
            return name in me ? me[ name ] : ( me.length == 1 ? me[0][ name ] : undefined );
         }
      } );
   },
};

/*****************************************************************************/

function compile_property ( subject, prop, value ) { // Could have inlined but this will reduce closure.
   return function ( ) { return property_compiler.call( this, subject, prop, value, arguments ); };
}

function property_compiler ( subject, prop, value, args ) {
   try {
      var body = String( value ), func;
      if ( (""+value).match( /^(\d+|[^"\r\n]*"|'[^'\r\n]*'|`[^`]*`|true|false|null|undefined)$/ ) ) { // simple values
         body = 'return ' + body;
         func = subject[ prop ] = new Function( body );
      } else {
         var head = '', varlist = [];
         if ( body.match( /\bdb\b/ ) ) varlist.push( 'db=dd5.rule.wrapper.res' );
         if ( body.match( /\byou\b/ ) ) varlist.push( 'you=dd5.rule.wrapper.you(this)' );
         if ( body.match( /\bmin\b/ ) ) varlist.push( 'min=Math.min' );
         if ( body.match( /\bmax\b/ ) ) varlist.push( 'max=Math.max' );
         if ( body.match( /\btoCId\b/ ) ) varlist.push( 'toCId=dd5.sys.toCId' );
         if ( body.match( /\bfloor\b/ ) ) varlist.push( 'floor=Math.floor' );
         if ( body.match( /\bround\b/ ) ) varlist.push( 'round=Math.round' );
         if ( varlist.length ) head += `var ${ varlist.join( ',' ) };`;
         if ( ! body.match( /\breturn\b/ ) ) head += 'return ';
         body = head + body;
         var func_name = prop + '_compiled';
         var exp_catch = `catch(err_obj){err_obj.message+='; source: '+${func_name}.exp;throw err_obj}`;
         // returning function expression is necessary for named function, so that the function can be referred in exception handler.
         func = new Function(`'use strict'; return (function ${func_name}(){'use strict'; try{ ${body} } ${exp_catch} } )`)();
      }
      subject[ prop ] = func;
      func.exp = body;
   } catch ( ex ) {
      log.error( `Cannot compile ${ subject.cid }.${ prop }: ${ value }`, ex );
      delete subject[ prop ];
   }
   return func.apply( this, args ); // "this" may have inherited subject and thus different from subject
};

/**
 * Prototype of Resource (catagorised) and Subrule (non-catagorised).
 */
rule.Rule = {
   '__proto__' : sys.Composite,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Rule );
      sys.Composite.create.call( me, opt );
      _.assert( rule.Resource.isPrototypeOf( me ) || rule.subrule.Subrule.isPrototypeOf( me ), 'Rule not resource or subrule!' );
      if ( opt.id ) _.assert( opt.id.match( /^[\w-]+$/ ), `Invalid id "${ opt.id }", must be alphanumeric, underscore, or hypen.` );
      for ( var prop of me.copy_list ) { var val = opt[ prop ];
         if ( val !== undefined && val !== null ) {
            _.assert( ! me.hasOwnProperty( prop ), `[dd5.Rule] Rule ${ this.cid }#${ this.id } cannot copy property "${ prop }" to created component.` );
            me[ prop ] = val;
            delete opt[ prop ];
         }
      }
      for ( var prop of me.compile_list ) { var val = opt[ prop ];
         if ( val !== undefined && val !== null ) {
            _.assert( ! me.hasOwnProperty( prop ), `[dd5.Rule] Rule ${ this.cid } cannot copy property "${ prop }" to created component.` );
            me[ prop ] = compile_property( me, prop, val );
            delete opt[ prop ];
         }
      }
      return me;
   },
   'compile_list' : [],
   'copy_list' : [],
   'build' ( ) {
      log.finer( '[dd5.rule] Creating ' + this.cid );
      var result = sys.Composite.create.call( Object.create( this ) );
      result.build = null;
      for ( var c of this.children ) result.add( c.build() );
      return result;
   },
};

var Resource = rule.Resource = {
   '__proto__' : rule.Rule,
   'create' ( type, opt ) {
      var me = _.newIfSame( this, Resource );
      if ( ! opt.cid ) opt.cid = type + '.' + opt.id;
      rule.Rule.create.call( me, opt );
      _.assert( res[ type ] && me.id && me.cid, '[dd5.Resource] Resource must have id and compoent id.' );
      var dup = res[ type ].get( opt.id );
      if ( dup.length ) throw new Error( `Redeclaring ${ type }.${ me.id  }. (already declared by ${ dup[0].source.cid })` );
      if ( opt ) {
         if ( opt.source ) {
            if ( typeof( opt.source ) === 'string' ) opt.source = res.source.get({ id: opt.source })[0];
            me.source = opt.source;
         }
         _.curtail( opt, [ 'id', 'cid', 'name', 'parent', 'source' ] );
      }
      me.res_type = type;
      res[ type ].add( me );
      log.fine( 'Loaded resource: ' + me.cid );
      return me;
   },
   'res_type' : undefined,
   'source'   : undefined,
};

rule.Source = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Source );
      Resource.create.call( me, 'source', opt );
      return me;
   },
   'copy_list' : [
      'publisher',
      'category',
      'type',
      'url',
   ],
   'loaded' : null, // Array of loaded rules
};

rule.Entity = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Entity );
      Resource.create.call( me, 'entity', opt );
      // With entity, assume all properties are valid.
      for ( var prop in opt ) {
         if ( prop !== 'subrules' ) {
            if ( prop in me ) {
               log.warn( `Cannot set "${ prop }" of ${ me.cid }.` );
            } else {
               me[ prop ] = opt[ prop ];
               delete opt[ prop ];
            }
         }
      }
      return me;
   },
   'getName' ( ) {
      return _.l( `dd5.entity.${this.type}.${this.id}`, this.id );
   },
};

rule.Character = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Character );
      Resource.create.call( me, 'character', opt );
      me._query_stack = [];
      return me;
   },
   'build' ( ) {
      var me = Resource.build.call( this );
      me._query_stack = [];
      me.remap_query();
      me.addObserver( 'structure', ( mon ) => {
         if ( me.getCharacter() !== me ) return; // Run only if this is the root character
         var oldNodes = [], newNodes = [], updatedHooks = [], map = me._query_map;
         for ( var m of mon ) {
            if ( m.oldNodes ) for ( var c of m.oldNodes ) c.recur( e => oldNodes.push( e ) );
            if ( m.newNodes ) for ( var c of m.newNodes ) c.recur( e => newNodes.push( e ) );
         }
         oldNodes = _.unique( oldNodes );
         newNodes = _.unique( newNodes );
         if ( oldNodes.length && newNodes.length ) { // If the lists intersect, the state is uncertain and should just remap.
            for ( var c of oldNodes ) if ( newNodes.includes( c ) ) return me.remap_query();
            for ( var c of newNodes ) if ( oldNodes.includes( c ) ) return me.remap_query();
         }
         for ( var val of oldNodes ) { // Unhook removed component from query map
            if ( val.dependent_attribute ) {
               me.remap_query( val ); // Total cleanup required for dynamic rules
            } else if ( val.query_hook ) {
               for ( var h of val.query_hook() ) if ( h ) {
                  var lst = map[ h ];
                  if ( ! lst || ! lst.includes( val ) ) log.warn( "Inconsistent query map: Cannot unhook " + val + " from " + h );
                  else lst.splice( lst.indexOf( val ), 1 );
                  if ( ! updatedHooks.includes( h ) ) updatedHooks.push( h );
               }
            }
         }
         for ( var val of newNodes ) if ( val.query_hook ) { // Hook new component to query map
            for ( var h of val.query_hook() ) if ( h ) {
               var lst = map[ h ] || ( map[ h ] = [] );
               if ( lst.includes( h ) ) log.warn( "Inconsistent query map: Cannot hook " + val + " to " + h );
               else lst.push( val );
               if ( ! updatedHooks.includes( h ) ) updatedHooks.push( h );
            }
         }
         me.fireAttributeChanged( updatedHooks );
      } );
      me.addObserver( 'attribute', ( mon ) => {
         var last = '';
         for ( var m of mon ) {
            if ( m.target === me && m.name === 'parent' ) {
               if ( m.oldValue ) last = 'Detach';
               if ( m.newValue ) last = 'Attach';
            }
         }
         if      ( last === 'Detach' ) me.remap_query();        // This character is deteched; remap query.
         else if ( last === 'Attach' ) me._query_map = _.map(); // This character is attached; clear query map.
      } );
      return me;
   },
   '_query_map' : null,
   'remap_query' ( component ) {
      var updatedHooks = [], map = this._query_map;
      if ( component ) {
         // A component's query hook has changed. We need to find and remove all old reference and add new reference.
         // Please note that this usage is NOT recursive.
         for ( var hook in this._query_map || {} ) {
            var pos = this._query_map[ hook ].indexOf( component );
            if ( pos >= 0 ) {
               this._query_map[ hook ].splice( pos, 1 );
               updatedHooks.push( hook );
            }
         }
         if ( component.query_hook && component.getCharacter() === this ) { // Done remove part. Now try to add.
            for ( var hook of _.array( component.query_hook() ) ) {
               var lst = map[ hook ] || ( map[ hook ] = [] );
               lst.push( component );
               if ( ! updatedHooks.includes( hook ) ) updatedHooks.push( hook );
            }
         }
      } else {
         // Update all maps
         _.assert( this.getCharacter() === this, 'remap_query cannot be called on non-top character' );
         map = this._query_map = _.map();
         this.recur( ( n ) => {
            if ( n === this || ! n.query_hook ) return;
            for ( var h of n.query_hook() ) if ( h ) {
               var lst = map[ h ] || ( map[ h ] = [] );
               lst.push( n );
            }
         } );
         updatedHooks = Object.keys( this._query_map );
      }
      this.fireAttributeChanged( updatedHooks );
   },

   '_query_stack' : null,

   'query' : function ( query ) {
      var key = query.query;
      if ( this._query_stack.includes( key ) ) {
         log.warn( `Recursive query ${key}. Query stack: [ ${this._query_stack.join(' > ')} ].` );
         return query;
      }
      this._query_stack.push( key );
      try {
         if ( query.query.indexOf( '.' ) >= 0 || this._query_map === null ) { // If query contains dot, it is likely a path, do not use query map.
            Resource.query.call( this, query );
         } else { // Non-path query will go through observer map for optimal execution.
            if ( query.query in this._query_map )
               for ( var comp of _.ary( this._query_map[ query.query ] ) ) try {
                  comp.query( query );
               } catch ( err ) {
                  log.error( `Error on ${comp.getPath()} in query ${key}`, err );
               }
         }
      } finally {
         this._query_stack.pop();
      }
      return query;
   }
};

rule.Feature = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Feature );
      Resource.create.call( me, 'feature', opt );
      return me;
   },
   'copy_list' : [ 'type', 'of' ]
};

rule.Race = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var me = _.newIfSame( this, rule.Race );
      Resource.create.call( me, 'race', opt );
      return me;
   },
};

})( dd5 );