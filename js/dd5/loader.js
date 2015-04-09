/*                                                                                                                      <![CDATA[ ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab */
var dd5; // Globals
if ( ! dd5 ) throw Error( '[dd5.loader] 5e core module must be loaded first.' );
else if ( ! dd5.loader ) ( function dd5_loader_init ( ns ) { 'use strict';

var sys = ns.sys;
var res = ns.res;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule;

var loaded_url = [];
var loaded_rules;
var loading_source;

var loader = ns.loader = {
   stack: {}, // Loader stack, used to match load request with load data

   load ( opt, source ) {
      _.assert( ns && ns.rule && ns.rule.subrule, '[dd5.loader] 5e subrule module must be loaded first.');
      if ( typeof( opt ) === 'string' ) opt = { url: opt };
      var done = opt.ondone, err = opt.onerror, url = opt.url;
      var stack = loader.stack;

      if ( stack[ url ] ) {
         var msg = '"' + url + '" is being loaded.';
         if ( err ) err( msg );
         return log.warn( msg );
      }
      stack[ url ] = source || url;

      opt.onload = ( ) => {
         log.info( '[dd5.load] "' + url + '" loaded.' );
         if ( source ) source.loaded = loaded_rules;
         loaded_url.push( stack[ url ] );
         loader.event.fire( 'progress', opt, stack[ url ] );
         delete stack[ url ];
         if ( Object.keys( stack ).length <= 0 ) {
            loader.event.fire( 'load', loaded_url );
            loaded_url = [];
         }
         if ( done ) done( ... arguments );
      };
      opt.onerror = ( ) => {
         log.warn( `[dd5.load] "${ opt.url }" failed to load.` );
         delete stack[ url ];
         if ( err ) err( ... arguments );
      };

      opt.xhr = _.js( opt );
   },

   /** jsonp loader callback */
   jsonp : {
      /** Generic callback called by jsonp rule resources */
      load_rules ( data ) {
         var src, version = data.version, id = data.id;
         loaded_rules = [];
         _.time();

         // Version validation
         if ( version !== 'alpha' ) return log.error( 'Unknown jsonp data version "' + version + '".' );
         delete data.version;

         // Set the sourcebook of this data, if provided
         if ( data.source && typeof( data.source ) === 'string' ) {
            src = res.source.get( data.source );
            if ( src.length >= 1 ) {
               src = src[0];
            } else {
               log.warn( "[dd5.loader] Source not yet defined: " + data.source );
               src = null;
            }
            delete data.source;
         }
         loading_source = src;

         // Load data
         var logid = document.currentScript ? document.currentScript.getAttribute('src') : ( JSON.stringify(data).length+" characters" );
         _.log.collapse( "Loading " + logid );
         for ( var i = 0, len = data.data.length ; i < len ; i++ ) try {
            var entry = data.data[ i ], result;
            if ( ! entry ) continue;

            var type = entry.entry;
            if ( type === undefined ) {
               entry = loader.jsonp.compile_object( entry );
               type = entry.entry;
            }
            delete entry.entry;
            switch ( type.toLowerCase() ) {
               case 'source' :
                  result = rule.Source.create( entry );
                  if ( result.url ) loader.load( result.url, result );
                  break;

               case 'character' :
               case 'class' :
               case 'entity' :
               case 'feature' :
               case 'race' :
               case 'equipment' :
                  result = loader.jsonp.load_rule( type, entry );
                  break;

               default :
                  log.error( `[dd5.loader] Unknown entry type: ${type}` );
                  continue;
            }

            loader.jsonp.check_unused_attr( entry, ' in ' + result.cid );
            loaded_rules.push( result );
         } catch ( ex ) {
            log.error( `Cannot load ${type}.${ entry.id ? entry.id : ( '#' + i ) }`, ex );
         }
         _.time( `${logid} loaded` );
         _.log.end();
      },

      load_rule ( type, e ) {
         if ( ! e.source && loading_source ) e.source = loading_source;
         if ( ! e.id ) e = loader.jsonp.compile_object( e );
         var uftype = _.ucfirst( type );
         var r = rule[ uftype ].create( e );
         if ( e.subrules && e.subrules.length ) {
            r.add( e.subrules.map( ( sub, i ) => { try {
               return loader.jsonp.load_subrule( sub );
            } catch ( ex ) {
               return log.error( `[dd5.loader] Cannot create ${i}th subrule of ${ r.cid } (${ JSON.stringify( sub ) })`, ex );
            } } ).filter( e => e ) );
         }
         delete e.subrules;
         return r;
      },

      check_unused_attr ( e, suffix ) {
         for ( var a in e ) ns.event.warn( `Unused attribute "${a}" (value "${e[a]}")' ${suffix}` );
      },

      // Convert a string into jsonp subrule
      compile_string : ( e ) => {
         e = e.trim();
         var pos = e.indexOf( ':' );
         var left = ( pos >= 0 ? e.substr( 0, pos ).trim() : e ).split( /\s*\.\s*/g );
         var right = pos >= 0 ? e.substr( pos + 1 ).trim() : null;
         var subrule = left[0].toLowerCase();

         // TODO: combine entry and subrule.
         switch ( subrule ) {
            case 'adj' :
               if ( left.length !== 2 || ! left[1] || ! right ) throw `Invalid adj syntax: ${e}`;
               var { val, min, max } = parse_value_range( right );
               var result = { subrule: subrule, value: val, property: quote( left[1] ) };
               if ( min !== undefined ) result.min = min;
               if ( max !== undefined ) result.max = max;
               return result;
               break;

            case 'feature':
               if ( left.length !== 2 || ! right ) throw `Invalid feature syntax: ${e}`;
               return { entry: 'feature', subrule: 'feature', id: left[1], subrules: right.trim().split( /\s*;\s*/g ) };

            case 'include' : // include : xxx.yyy
               if ( left.length > 1 ) throw "Invalid include syntax: " + e;
               return { 'subrule': 'include', 'include': right };

            case 'negate' :
               if ( left.length !== 2 || ! left[1] ) throw `Invalid negate syntax: ${e}`;
               var result = { subrule: subrule, property: quote( left[1] ) };
               var pos = right ? right.indexOf( '[' ) : -1;
               if ( pos > 0 ) {
                  var { min, max } = parse_value_range( right.substr( pos ) );
                  if ( min !== undefined ) result.min = min;
                  if ( max !== undefined ) result.max = max;
                  right = right.substr( 0, pos ).trim();
               }
               if ( right ) {
                  if ( right.match( /[."';\[\(]/ ) ) {
                     result.negate_target = quote( right );
                  } else {
                     var target = [], whitelist = [];
                     right.split( /\s*,\s*/ ).forEach( e => {
                        if ( e.startsWith( "^" ) ) whitelist.push( e.substr( 1 ) );
                        else target.push( e );
                     } );
                     if (    target.length ) result.negate_target     = quote(    target.join(",") );
                     if ( whitelist.length ) result.negate_whitelistt = quote( whitelist.join(",") );
                  }
               }
               return result;

            case 'profslot' :
            case 'numslot' :
            case 'slot' :
               var result = { subrule: subrule, id : left.pop() };
               if ( subrule === 'profslot' ) {
                  result.prof_type = 'prof$' + left.pop();
                  right = parse_prof_string( right );
               }
               if ( subrule === 'numslot' ) {
                  var { val, min, max } = parse_value_range( right );
                  if ( val !== undefined ) result.default = val;
                  if ( min !== undefined ) result.min_val = min;
                  if ( max !== undefined ) result.max_val = max;
               } else {
                  result.options = right; // slot and profslot
               }
               if ( left.length !== 1 || ! right ) throw `Invalid slot syntax: ${e}`;
               return result;
               break;

            case 'prof' :
               if ( left.length !== 2 || ! right ) throw `Invalid prof syntax: ${e}`;
               return { subrule: 'prof', prof_type: 'prof$' + left[1], 'value': parse_prof_string( right ) };

            default:
               throw Error( "Unknown subrule shortcut type '" + left[0] + "'" );
         }
      },

      // Convert a simplified jsonp subrule into full jsonp subrule
      compile_object ( e ) {
         if ( e.adj ) {
            e.subrule = 'adj';
            e.property = e.adj;
            delete e.adj;

         } else if ( e.class ) {
            e.subrule = e.entry = 'class';
            e.id = e.class;
            e.level = e.class.match( /\d+$/ )[0];
            e.class = e.class.replace( /\d+$/, '' );
            if ( e.class.match( /^mc-/ ) ) {
               e.class = e.class.match( /^mc-/ )
            }
            console.log( JSON.stringify( e ) );

         } else if ( e.prof ) {
            e.subrule = 'prof';
            e.prof_type = 'prof$' + e.prof;
            delete e.prof;
         } else {
            for ( var p of [ 'feature', 'slot', 'profSlot', 'numSlot' ] ) {
               if ( e[ p ] ) {
                  e.subrule = e.entry = p;
                  e.id = e[ p ];
                  delete e[ p ];
                  break;
               }
            }
         }
         return e;
      },

      load_subrule ( e ) {
         var result;
         log.finest( "Loading subrule: " + JSON.stringify( e ) );
         if ( typeof( e ) === 'string' ) {
            e = this.compile_string( e );
         } else if ( ! e.subrule ) {
            e = this.compile_object( e );
         }
         _.assert( typeof( e ) === 'object' );
         switch ( e.subrule.toLowerCase() ) {
            case 'adj' : // Adjust a Value
               result = subrule.Adj.create( e );
               break;

            case 'feature' :
               result = loader.jsonp.load_rule( 'feature', e );
               break;

            case 'negate' :
               result = subrule.Negate.create( e );
               break;

            case 'numslot' : // Numeric slot
               result = subrule.NumSlot.create( e );
               break;

            case 'include' : // Include another rule
               result = subrule.Include.create( e );
               break;

            case 'prof' : // Grant proficient
               result = subrule.Prof.create( e );
               break;

            case 'profslot' : // Proficiency slot
               result = subrule.ProfSlot.create( e );
               break;

            case 'slot' : // Entity slot
               result = subrule.Slot.create( e );
               break;

            default:
               throw Error( "unknown subrule type '" + e.subrule + "'" );
         }
         return result;
      }
   },

   event : _.EventManager.create( [ 'load', 'progress' ] ),

   parser : null // Created in parser.js
};

/**
 * Convert <code>type : id</code> into <code>db[type]("id")</code> and
 * <code>type : id1, id2</code> into <code>db[type]({id:["id1","id2"]})</code>.
 * src with dots or quotes are unaffected.
 * @param {String} src String form proficiency.
 * @return {String} Converted string form.
 */
function parse_prof_string ( src ) {
   if ( src.indexOf( "." ) >= 0 && src.indexOf( '"' ) >= 0 ) return src;
   var pos = src.indexOf( ":" ), type, id;
   if ( pos < 0 ) {
      log.warn( `Missing proficiency type, defaulting to entity: "${ src }".` );
      src = "entity:" + src;
      pos = "entity".length;
   }
   var type = src.substr( 0, pos ).trim(), ids = src.substr( pos + 1 );
   return `db.${type}({id:${ quote( ids ) }})`;
}

function quote ( src ) {
   src = src.trim();
   if ( src.match( /[."';\[\(]/ ) ) return src;
   if ( src.indexOf( ',' ) >= 0 ) return '["' + src.replace( /\s*,\s*/g, '","' ) + '"]';
   return `"${src}"`;
}

function parse_value_range ( src ) {
   src = src.trim();
   if ( src.match( /[a-zA-Z_]/ ) ) return { val: src };
   if      ( src.match( /^\-?\d+\.?$/   ) ) return { val: parseInt  ( src ) };
   else if ( src.match( /^\-?\d*\.\d+$/ ) ) return { val: parseFloat( src ) };
   var values = src.match( /^(-?\d+)?\s*\[(-?\d+)?,(-?\d+)?\]$/ ), result = {};
   if ( values ) {
      if ( values[1] ) result.val = parseInt( values[1] );
      if ( values[2] ) result.min = parseInt( values[2] );
      if ( values[3] ) result.max = parseInt( values[3] );
   }
   return result;
}

pinbun.event.load( 'dd5.loader' );

})( dd5 );/*]]>*/