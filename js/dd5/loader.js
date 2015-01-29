var dd5; // Globals
if ( ! dd5 ) throw new Error( '[dd5.loader] 5e core module must be loaded first.' );
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
   'stack': {}, // Loader stack, used to match load request with load data

   'load' ( opt, source ) {
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
   'jsonp' : {
      /** Generic callback called by jsonp rule resources */
      'load_rules' ( data ) {
         var src, version = data.version, id = data.id;
         loaded_rules = [];

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
         _.log.collapse( "Loading " + ( document.currentScript ? document.currentScript.getAttribute('src') : ( JSON.stringify(data).length+" characters" ) ) );
         for ( var type in data ) {
            var proc, data_entry = data[ type ], lctype = type.toLowerCase();
            switch ( lctype ) {
               case 'source' :
                  proc = ( e ) => {
                     var r = rule.Source.create( e );
                     if ( r.url ) loader.load( r.url, r );
                     return r;
                  };
                  break;

               case 'character' :
               case 'entity' :
               case 'feature' :
               case 'race' :
                  proc = ( e ) => loader.jsonp.load_rule( type, e );
                  break;

               default :
                  log.error( `[dd5.loader] Unknown resource type: ${type}` );
            }

            if ( ! proc ) continue;

            var safeCall = ( e, i ) => {
               try {
                  var result = proc( e );
                  loader.jsonp.check_unused_attr( e, ' in ' + result.cid );
                  loaded_rules.push( result );
               } catch ( ex ) {
                  log.error( `Cannot load ${type}.${ e.id ? e.id : ( '#' + i ) }`, ex );
               }
            };
            if ( Array.isArray( data_entry ) ) data_entry.forEach( safeCall );
            else safeCall( data_entry );
         }
         _.log.end();
      },

      'load_rule' ( type, e ) {
         if ( ! e.source && loading_source ) e.source = loading_source;
         var uftype = _.ucfirst( type );
         var r = rule[ uftype ].create( e );
         if ( e.subrules && e.subrules.length ) {
            e.subrules.forEach( ( sub, i ) => { try {
               r.add( loader.jsonp.load_subrule( sub ) );
            } catch ( ex ) {
               log.error( `[dd5.loader] Cannot create ${i}th subrule of ${ r.cid } (${ JSON.stringify( sub ) })`, ex );
            } } );
         }
         delete e.subrules;
         return r;
      },

      'check_unused_attr' ( e, suffix ) {
         for ( var a in e ) ns.event.warn( `Unused attribute "${a}" (value "${e[a]}")' ${suffix}` );
      },

      // Convert a string into jsonp subrule
      'compile_string' : ( e ) => {
         e = e.trim();
         var pos = e.indexOf( ':' );
         var left = ( pos >= 0 ? e.substr( 0, pos ).trim() : e ).split( /\s*\.\s*/g );
         var right = pos >= 0 ? e.substr( pos + 1 ).trim() : null;
         var subrule = left[0].toLowerCase();

         switch ( subrule ) {
            case 'prof' :
               var result = { 'subrule': 'prof', 'prof_type': 'prof$' + left[1], 'value': `db.entity("${ right }")` };
               if ( left.length !== 2 || ! right ) throw `Invalid prof syntax: ${e}`;
               return result;

            case 'adj' : // "adj.[prop](.min\d+)?(.max\d+)?" : "[bonus]" // Add a bonus(penalty), min/max X(-X) e.g. adj.check.dex=2
            case 'set' : // "set(min|max).[prop](.min\d+)?(.max\d+)?" : "[value]" // Set a property to given value
            case 'setmin' :
            case 'setmax' :
               var result = { 'subrule': subrule, 'value': right }, next = left.pop();
               if ( next && next.startsWith( 'max' ) ) {
                  result.max = next.substr( 3 );
                  next = left.pop();
               }
               if ( next && next.startsWith( 'min' ) ) {
                  result.min = left.pop().substr( 3 );
                  next = left.pop();
               }
               result.property = '"' + next + '"';
               if ( left.length !== 1 || ! result.property || ! right ) throw `Invalid adj/set syntax: ${e}`;
               return result;
               break;

            case 'slot' :
            case 'numslot' :
            case 'profslot' :
               var result = { 'subrule': subrule, 'id' : left.pop() };
               if ( subrule === 'profslot' ) result.prof_type = 'prof$' + left.pop();
               if ( subrule === 'numslot' ) {
                  var values = right.match( /^(-?\d+)?\s*\[(-?\d+)?,(-?\d+)?\]$/ );
                  if ( values[1] ) result.default = parseInt( values[1] );
                  if ( values[2] ) result.min_val  = parseInt( values[2] );
                  if ( values[3] ) result.max_val  = parseInt( values[3] );
               } else {
                  result.options = right; // slot and profslot
               }
               if ( left.length !== 1 || ! right ) throw `Invalid slot syntax: ${e}`;
               return result;
               break;

            case 'include' : // include : xxx.yyy
               if ( left.length > 1 ) throw "Invalid include syntax: " + e;
               return { 'subrule': 'include', 'include': right };

            default:
               throw new Error( "Unknown subrule shortcut type '" + left[0] + "'" );
         }
      },

      // Convert a simplified jsonp subrule into full jsonp subrule
      'compile_object' ( e ) {
         for ( var p of [ 'feature', 'slot' ] ) {
            if ( e[ p ] ) {
               e.subrule = p;
               e.id = e[ p ];
               delete e[ p ];
               break;
            }
         }
         return e;
      },

      'load_subrule' ( e ) {
         var result;
         log.finest( "Loading subrule: " + JSON.stringify( e ) );
         if ( typeof( e ) === 'string' ) {
            e = this.compile_string( e );
         } else if ( ! e.subrule ) {
            e = this.compile_object( e );
         }
         _.assert( typeof( e ) === 'object' );
         switch ( e.subrule ) {
            // Wrappers
            case 'feature' :
               result = loader.jsonp.load_rule( 'feature', e );
               break;

            // Dynamic effects
            case 'slot' : // Entity slot
               result = subrule.Slot.create( e );
               break;

            case 'numslot' : // Numeric slot
               result = subrule.NumSlot.create( e );
               break;

            case 'profslot' : // Proficiency slot
               result = subrule.ProfSlot.create( e );
               break;

            // Static effects
            case 'adj' : // Adjust a Value
               result = subrule.Adj.create( e );
               break;

            case 'prof' : // Grant proficient
               result = subrule.Prof.create( e );
               break;

            case 'include' : // Include another rule
               result = subrule.Include.create( e );
               break;

            // Triggered effects
            case 'check' : // Modify an ability check
               break;
            case 'save' : // Modify a saving throw
               break;
            case 'attack' : // Modify an attack
               break;
            case 'damage' : // Modify a damage
               break;

            default:
               throw new Error( "unknown subrule type '" + e.subrule + "'" );
         }
         return result;
      }
   },

   'event' : _.EventManager.create( [ 'load', 'progress' ] ),

   'parser' : null // Created in parser.js
};

pinbun.event.load( 'dd5.loader' );

})( dd5 );