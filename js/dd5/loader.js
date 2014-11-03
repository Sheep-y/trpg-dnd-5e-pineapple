(function dd5_loader_init( ns ){ 'use strict';

var err_loader = '[dd5.loader] ';
_.assert( ns && ns.rule && ns.rule.subrule, err_loader + '5e subrule rule module must be loaded first.');
_.assert( ! ns.loader, err_loader + '5e loader module already loaded.' );


var sys = ns.sys;
var res = ns.res;
var rule = ns.rule;
var subrule = rule.subrule;

var nswarn = ns.event.warn;
var nserr = ns.event.error;

var loader = ns.loader = {
   stack: [], // Loader stack, used to match load request with load data

   load : function dd5_Loader_load ( opt, onload ) {
      if ( typeof( opt ) === 'string' ) opt = { url: opt };
      var done = opt.ondone;
      var stack = loader.stack;

      stack.push( opt );
      if ( ! dd5_Loader_load.loaded ) dd5_Loader_load.loaded = [];
      opt.onload = function dd5_Loader_load_ondone( url, option ) {
         _.log( 'loaded' );
         stack.splice( stack.indexOf( opt ), 1 );
         opt.loaded = loader.jsonp.load.loaded;
         dd5_Loader_load.loaded.push( opt );
         loader.event.fire( 'progress', opt );
         if ( stack.length <= 0 ) {
            loader.event.fire( 'load', dd5_Loader_load.loaded );
            dd5_Loader_load.loaded = [];
         }
         _.call( done, this, url, option );
      };

      opt.xhr = _.js( opt );
   },

   /** jsonp loader callback */
   jsonp : {
      load : function dd5_Loader_jsonp_load ( data ) {
         var src, version = data.version, id = data.id;
         dd5_Loader_jsonp_load.loaded = [];

         // Version validation
         if ( version === undefined ) return nserr( err_loader + "Unknown data (no version tag)." );
         delete data.version;

         if ( id === undefined ) nswarn( "Data without id" );
         delete data.id;

         // Set the sourcebook of this data, if provided
         if ( data.sourcebook && typeof( data.sourcebook ) === 'string' ) {
            src = res.sourcebook.get({ 'id': data.sourcebook });
            if ( src.length >= 1 ) src = src[0];
            else nswarn( "Source not yet defined: " + data.sourcebook );
            delete data.sourcebook;
         }

         // Given a rule, set its source and compile method, and add it to given resource list
         function dd5_Loader_jsonp_load_gen_creator ( list, rule ) {
            return function dd5_Loader_jsonp_load_creator ( e ) {
               e.sourcebook = src;
               var result = new rule( e );
               if ( e.subrules ) {
                  if ( e.subrules.length ) // Has subrule; set compile method
                     result.compile = loader.jsonp.compile_method;
                  else
                     delete result.subrules; // No need to keep empty subrules
                  delete e.subrules;
               }
               list.add( result );
               dd5_Loader_jsonp_load.loaded.push( result );
               return result;
            };
         }

         // Load data
         _.log.group( "Loading " + id );
         for ( var type in data ) {
            var proc, data_entry = data[ type ];
            switch ( type.toLowerCase() ) {
               case 'comment' :
                  src.comment = src.comment ? ( src.comment + data_entry ) : data_entry;
                  break;

               case 'sourcebook' :
                  proc = function dd5_Loader_jsonp_load_sourcebook ( e ) {
                     src = new rule.SourceBook( e );
                     res.sourcebook.add( src );
                     if ( src.url && _.is.yes( src.autoload ) ) loader.load( src.url );
                     dd5_Loader_jsonp_load.loaded.push( src );
                     return src;
                  };
                  break;

               case 'entity' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.entity, rule.Entity );
                  break;

               case 'character' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.character, rule.Character );
                  break;

               case 'race' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.race, rule.Race );
                  break;

               default :
                  nserr( err_loader + "Unknown resource type: " + type );
            }

            if ( ! proc ) continue;

            var safe = function dd5_Loader_jsonp_load_try ( e, i ) {
               try {
                  var result = proc( e );
                  loader.jsonp.check_unused_attr( e, ' in ' + result.l10n );
               } catch ( ex ) {
                  nserr( err_loader + 'Cannot load ' + type + ( e.id ? '.'+e.id : '' ) + ':\n' + ex );
               }
            };
            if ( data_entry instanceof Array ) data_entry.forEach( safe );
            else safe( data_entry );
         }

         loader.event.fire( 'progress', data );
         _.log.end();
      },

      compile_method : function dd5_Loader_jsonp_compile_method () {
         var that = this, jsonp = loader.jsonp;
         this.subrules.forEach( function dd5_Loader_jsonp_compile_subrule ( e, i ) {
            if ( ! e ) return;

            try {
               var subrule = '(' + i + 'th subrule) of ' + that.l10n + ': ' + e;
               if ( typeof( e ) === 'string' ) e = jsonp.compile_shortcut( e );
               var id = e.id;

               if ( e.slot ) { // Slot shortcut
                  e.subrule = 'slot';
                  if ( ! e.id ) e.id = id = e.slot;
                  delete e.slot;
               }
               if ( id ) subrule = '#' + id + ' ' + subrule + ': ' + e;

               if ( ! e.subrule ) throw "Subrule type not specified: " + JSON.stringify( e );
               that.add( jsonp.compile_subrule( e ) );
               delete e.subrule;
               jsonp.check_unused_attr( e, ' in ' + subrule );

            } catch ( ex ) {
               var msg =
               nserr( err_loader + 'Cannot compile ' + subrule + ':\n' + ex );
            }
         } );
         _.info( 'Compiled ' + this.l10n );
         delete this.subrules;
         delete this.compile;
      },

      check_unused_attr : function dd5_Loader_jsonp_check_unused_attr ( e, suffix ) {
         for ( var a in e ) ns.event.warn( err_loader + 'Unused attribute "' + a + '" (value "' + e[a] + '")' + suffix );
      },

      // Convert a string into object with property
      compile_shortcut : function dd5_Loader_jsonp_compile_shortcut ( e ) {
         e = e.trim();
         var pos = e.indexOf( ':' );
         var left = ( pos >= 0 ? e.substr( 0, pos ).trim() : e ).split( /\s*\.\s*/g );
         var right = pos >= 0 ? e.substr( pos+1 ).trim() : '';
         var subrule = left[0].toLowerCase();

         switch ( subrule ) {

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
               result.property = next;
               if ( left.length !== 1 || ! result.property || ! right ) throw "Invalid adjustment / set syntax: " + e;
               return result;
               break;

            case 'prof' : // "prof.[type]" = "[list]"
               break;

            case 'include' : // include : #xxx.yyy
               if ( left.length > 1 ) throw "Invalid include syntax: " + e;
               return { 'subrule': 'include', 'include': right };

            default:
               throw "Unknown subrule shortcut type '" + left[0] + "'";
         }
      },

      compile_subrule : function dd5_Loader_jsonp_compile_subrule ( e ) {
         var result;
         switch ( e.subrule ) {
            // Wrapper objects
            case 'feature' :
               result = new rule.Feature( { id: id }, parent );
               loader.load_rule( result, e );
               break;

            case 'level' : // Wrapped rule is only available after certain root level.
               break;

            case 'effect' :
               break;

            // Slot
            case 'slot' :
               result = new subrule.Slot( e );
               break;

            // Static effects
            case 'adj' : // Adjust a Value
               result = new subrule.Adj( e );
               break;

            case 'set' : // Set a value
               result = new subrule.Set( e );
               break;

            case 'prof' : // Grant proficient
               break;

            case 'include' : // Include another rule
               result = new subrule.Include( e );
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
               throw "unknown subrule type '" + e.subrule + "'";
         }
         return result;
      }
   },

   event : new _.EventManager( [ 'load', 'progress' ] ),

   parser : null // Created in parser.js
};

})( dd5 );