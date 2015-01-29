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
   you : {
      // Divert unknown properties to query function
      'get' ( that, name ) {
         return name in that ? that[ name ] : that.query( sys.Query.create( name, that ) ).value;
      }
   },
   res : {
      // Repack categories as function
      'get' ( that, name ) {
         return name in that
            ? criteria => new Proxy( that[ name ].get( criteria ), rule.wrapper.first )
            : null;
      }
   },
   first : {
      // if there is only one match, divert unknown properties to first result
      'get' ( that, name ) {
         return name in that ? that[ name ] : ( that.length == 1 ? that[0][ name ] : undefined );
      }
   }
};

/*****************************************************************************/

function compile_property ( subject, prop, value ) {
   return function property_compiler ( ) {
      try {
         var body = String( value ), func;
         if ( (""+value).match( /^(\d+|[^"\r\n]*"|'[^'\r\n]*'|`[^`]*`|true|false|null|undefined)$/ ) ) { // simple values
            body = 'return ' + body;
            func = subject[ prop ] = new Function( body );
         } else {
            var head = '', varlist = [];
            if ( body.match( /\bdb\b/ ) ) varlist.push( 'db=new Proxy(dd5.res,dd5.rule.wrapper.res)' );
            if ( body.match( /\byou\b/ ) ) varlist.push( 'you=new Proxy(this.getCharacter(),dd5.rule.wrapper.you)' );
            if ( body.match( /\bmin\b/ ) ) varlist.push( 'min=Math.min' );
            if ( body.match( /\bmax\b/ ) ) varlist.push( 'max=Math.max' );
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
      return func.apply( this, _.ary( arguments, 3 ) ); // "this" may have inherited subject and thus different from subject
   };
}

/**
 * Prototype of Resource (catagorised) and Subrule (non-catagorised).
 */
rule.Rule = {
   '__proto__' : sys.Composite,
   'create' ( opt ) {
      var that = _.newIfSame( this, rule.Rule );
      sys.Composite.create.call( that, opt );
      _.assert( rule.Resource.isPrototypeOf( that ) || rule.subrule.Subrule.isPrototypeOf( that ), 'Rule not resource or subrule!' );
      if ( opt.id ) _.assert( opt.id.match( /^[\w-]+$/ ), `Invalid id "${ opt.id }", must be alphanumeric, underscore, or hypen.` );
      for ( var prop of that.copy_list ) { var val = opt[ prop ];
         if ( val !== undefined && val !== null ) {
            _.assert( ! that.hasOwnProperty( prop ), `[dd5.Rule] Rule ${ this.cid } cannot copy property "${ prop }" to created component.` );
            that[ prop ] = val;
            delete opt[ prop ];
         }
      }
      for ( var prop of that.compile_list ) { var val = opt[ prop ];
         if ( val !== undefined && val !== null ) {
            _.assert( ! that.hasOwnProperty( prop ), `[dd5.Rule] Rule ${ this.cid } cannot copy property "${ prop }" to created component.` );
            that[ prop ] = compile_property( that, prop, val );
            delete opt[ prop ];
         }
      }
      return that;
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
      var that = _.newIfSame( this, Resource );
      if ( ! opt.cid ) opt.cid = type + '.' + opt.id;
      rule.Rule.create.call( that, opt );
      _.assert( res[ type ] && that.id && that.cid, '[dd5.Resource] Resource must have id and compoent id.' );
      var dup = res[ type ].get( opt.id );
      if ( dup.length ) throw new Error( `Redeclaring ${ type }.${ that.id  }. (already declared by ${ dup[0].source.cid })` );
      if ( opt ) {
         if ( opt.source ) {
            if ( typeof( opt.source ) === 'string' ) opt.source = res.source.get({ id: opt.source })[0];
            that.source = opt.source;
         }
         _.curtail( opt, [ 'id', 'cid', 'name', 'parent', 'source' ] );
      }
      that.res_type = type;
      res[ type ].add( that );
      log.fine( 'Loaded resource: ' + that.cid );
      return that;
   },
   'res_type' : undefined,
   'source'   : undefined,
};

rule.Source = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var that = _.newIfSame( this, rule.Source );
      Resource.create.call( that, 'source', opt );
      return that;
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
      var that = _.newIfSame( this, rule.Entity );
      Resource.create.call( that, 'entity', opt );
      // With entity, assume all properties are valid.
      for ( var prop in opt ) {
         if ( prop !== 'subrules' ) {
            if ( prop in that ) {
               log.warn( `Cannot set "${ prop }" of ${ that.cid }.` );
            } else {
               that[ prop ] = opt[ prop ];
               delete opt[ prop ];
            }
         }
      }
      return that;
   }
};

rule.Character = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var that = _.newIfSame( this, rule.Character );
      Resource.create.call( that, 'character', opt );
      return that;
   },
   'build' ( ) {
      var that = Resource.build.call( this );
      that.remap_queries();
      that.addObserver( 'structure', ( mon ) => {
         if ( that.getCharacter() !== that ) return; // Run only if this is the root character
         for ( var m of mon ) {
            if ( m.oldValue !== null ) { // Element is deteched.  Unhook them from query map.
               m.oldValue.recur( null, ( val ) => {
                  if ( ! val.query_hook ) return;
                  for ( var h of val.query_hook() ) if ( h ) {
                     var lst = that._queries[ h ];
                     if ( ! lst || lst.indexOf( val ) < 0 ) log.warn( "Inconsistent query map: Cannot unhook " + val + " from " + h );
                     else lst.splice( lst.indexOf( val ), 1 );
                     that.fireAttributeChanged( h );
                  }
               } );
            }
            if ( m.newValue !== null ) { // Element is attached.  Unhook them from query map.
               m.newValue.recur( null, ( val ) => {
                  if ( ! val.query_hook ) return;
                  for ( var h of val.query_hook() ) if ( h ) {
                     var lst = that._queries[ h ] || ( that._queries[ h ] = [] );
                     lst.push( val );
                     that.fireAttributeChanged( h );
                  }
               } );
            }
         }
      } );
      that.addObserver( 'attribute', ( mon ) => {
         var last = '';
         for ( var m of mon ) {
            if ( m.target === that && m.name === 'parent' ) {
               if ( m.oldValue ) last = 'Detach';
               if ( m.newValue ) last = 'Attach';
            }
         }
         if      ( last === 'Detach' ) that.remap_queries();    // This character is deteched; remap queries.
         else if ( last === 'Attach' ) that._queries = _.map(); // This character is attached; reset query map.
      } );
      return that;
   },
   '_queries' : _.map(),
   'remap_queries' ( ) {
      this._queries = _.map();
      this.recur( null, ( n ) => {
         if ( n === this || ! n.query_hook ) return;
         for ( var h of n.query_hook() ) {
            var lst = this._queries[ h ] || ( this._queries[ h ] = [] );
            lst.push( n );
         }
      });
   },

   'query' : function ( query ) {
      if ( query.query.indexOf( '.' ) >= 0 ) {
         // Contains dot, likely a path, use tradidional recursive query
         //_.log( `QUERY: ${query.query} (Resursion)` );
         return Resource.query.call( this, query );
      } else {
         // Normal query will go through the query map for optimal execution
         var lst = this._queries[ query.query ];
         //_.log( `QUERY: ${query.query} (Map, ${ lst ? lst.length : 'none' })` );
         if ( lst ) {
            for ( var o of lst ) {
               //_.log( `QUERY: ${query.query} (${ o })` );
               o.query( query );
            }
         }
      }
      return query;
   }
};

rule.Feature = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var that = _.newIfSame( this, rule.Feature );
      Resource.create.call( that, 'feature', opt );
      return that;
   },
};

rule.Race = {
   '__proto__' : Resource,
   'create' ( opt ) {
      var that = _.newIfSame( this, rule.Race );
      Resource.create.call( that, 'race', opt );
      return that;
   },
};

})( dd5 );