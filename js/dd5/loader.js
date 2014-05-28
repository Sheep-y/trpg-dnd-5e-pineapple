'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.template && dd5.template.part, '[dd5.loader] 5e part template module must be loaded first.');
_.assert( ! dd5.loader, '5e loader module already loaded.' );

(function dd5_loader_init( ns ){

var sys = ns.sys;
var res = ns.res;
var template = ns.template;
var part = ns.template.part;

var err_loader = '[dd5.loader] ';
var nserr = ns.event.error;

var loader = ns.loader = {

   load : function dd5_Loader_jsonp_load ( opt ) {
      _.js( opt );
   },

   /** jsonp loader callback */
   jsonp : {
      load : function dd5_Loader_jsonp_load ( data ) {
         var src, version = data.version;

         // Version validation
         if ( version === undefined ) return nserr( err_loader + "Cannot load data without version." );
         delete data.version;

         // Set the sourcebook of this data, if provided
         if ( data.sourcebook && typeof( data.sourcebook ) === 'string' ) {
            src = res.sourcebook.get({ 'id': data.sourcebook });
            if ( src.length >= 1 ) src = src[0];
            delete data.sourcebook;
         }

         function dd5_Loader_jsonp_load_gen_creator ( list, template ) {
            return function dd5_Loader_jsonp_load_creator ( e ) {
               e.sourcebook = src;
               var result = new template( e );
               if ( e.parts ) {
                  if ( e.parts.length ) // Has part; set compile method
                     result.compile = loader.jsonp.compile_method;
                  else
                     delete result.parts; // No need to keep empty parts
                  delete e.parts;
               }
               list.add( result );
               return result;
            };
         }

         // Load data
         for ( var type in data ) {
            var proc, data_entry = data[ type ];
            switch ( type.toLowerCase() ) {
               case 'comment' :
                  src.comment = src.comment ? ( src.comment + data_entry ) : data_entry;
                  break;

               case 'sourcebook' :
                  proc = function dd5_Loader_jsonp_load_sourcebook ( e ) {
                     src = new template.SourceBook( e );
                     res.sourcebook.add( src );
                     if ( src.url && _.is.yes( src.autoload ) ) loader.load( src.url, src );
                     return src;
                  };
                  break;

               case 'entity' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.entity, template.Entity );
                  break;

               case 'character' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.character, template.Character );
                  break;

               case 'race' :
                  proc = dd5_Loader_jsonp_load_gen_creator( res.race, template.Race );
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
         // loader.event.fire( 'onload' );
      },

      compile_method : function dd5_Loader_jsonp_compile_method () {
         var that = this;
         this.parts.forEach( function dd5_Loader_jsonp_compile_part ( e, i ) {
            if ( ! e ) return;

            try {
               if ( typeof( e ) === 'string' ) e = loader.jsonp.compile_shortcut( e );

               if ( e.slot ) { // Slot shortcut
                  e.part = 'slot';
                  if ( ! e.id ) e.id = e.slot;
                  delete e.slot;
               }

               var id = e.id;
               if ( ! e.part ) throw "Part type not specified: " + JSON.stringify( e );
               that.add( loader.jsonp.compile_part( e ) );
               delete e.part;

               loader.jsonp.check_unused_attr( e, ' in part #' + i + ' of ' + that.l10n );

            } catch ( ex ) {
               var msg = 'Cannot compile part #' + i;
               if ( id ) msg += ' (' + id + ')';
               nserr( err_loader + msg + ' of ' + that.l10n + ':\n' + ex );
            }
         } );
         _.info( 'Compiled ' + this.l10n );
         delete this.parts;
         delete this.compile;
      },

      check_unused_attr : function dd5_Loader_jsonp_check_unused_attr ( e, postfix ) {
         for ( var a in e ) ns.event.warn( err_loader + 'Unused attribute "' + a + '" (value "' + e[a] + '")' + postfix ); 
      },

      compile_shortcut : function dd5_Loader_jsonp_compile_shortcut ( e ) {
         e = e.trim();
         var pos = e.indexOf( ':' );
         var left = ( pos > 0 ? e.substr( 0, pos-1 ).trim() : e ).split( /\s*\.\s*/g );
         var right = pos > 0 ? e.substr( pos+1 ).trim() : '';
         var part = left[0].toLowerCase();

         switch ( part ) {

            case 'adj' : // "adj.[prop](.min\d+)?(.max\d+)?" : "[bonus]" // Add a bonus(penalty), min/max X(-X) e.g. adj.check.dex=2
            case 'set' : // "set(min|max).[prop](.min\d+)?(.max\d+)?" : "[value]" // Set a property to given value
            case 'setmin' :
            case 'setmax' :
               var result = { 'part': part, 'value': right }, next = left.pop();
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
               return { 'part': 'include', 'include': right };

            default:
               throw "Unknown part shortcut type '" + left[0] + "'";
         }
      },

      compile_part : function dd5_Loader_jsonp_compile_part ( e ) {
         var result;
         switch ( e.part ) {
            // Wrapper objects
            case 'feature' :
               result = new template.Feature( { id: id }, parent );
               loader.load_template( result, e );
               break;

            case 'level' : // Wrapped template is only available after certain root level.
               break;

            case 'effect' :
               break;

            // Slot
            case 'slot' :
               result = new part.Slot( e );
               break;

            // Static effects
            case 'adj' : // Adjust a Value
               result = new part.Adj( e );
               break;

            case 'set' : // Set a value
               result = new part.Set( e );
               break;

            case 'prof' : // Grant proficient
               break;

            case 'include' : // Include another template
               result = new part.Include( e );
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
               throw "unknown part type '" + e.part + "'";
         }
         return result;
      }
   },

   parser : null // Created in parser.js
};

})( dd5 );