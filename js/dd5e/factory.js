'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5e && dd5e.Res, '5th edition resources must be loaded first.');

(function( ns ){

var sys = ns.Sys;
var res = ns.Res;
var base = ns.Base;

ns.Loader = {
   init : function dd5e_Loader_init ( opt ) {
      var onload = opt.onload;
      opt.onload = function dd5e_Loader_init_onload ( txt ) {
         try {
            var doc = _.xml( txt );
            _.ary( _( doc, 'source' ) ).forEach( function dd5e_Loader_init_onload_source (e) {
               var obj = {};
               [ 'id', 'name', 'publisher', 'category', 'type', 'url' ].forEach( function dd5e_Loader_init_onload_source_attr( attr ) {
                  if ( e.hasAttribute( attr ) ) obj[attr] = e.getAttribute( attr );
               } );
               obj = new base.Source( obj );
               if ( obj.url && _.true( e.getAttribute('autoload') ) ) ns.Loader.load( opt, obj );
            });
            if ( onload ) onload();
         } catch ( err ) {
            if ( opt.onerror ) opt.onerror( err ); else throw err;
         }
      };
      _.ajax( opt );
   },
   load : function dd5e_Loader_load ( opt, source ) {
      _.ajax({
         url: source.url,
         onload: function dd5e_Loader_load_onload ( txt ) {
            try {
               var doc = _.xml( txt ), root = doc.firstElementChild;
               _.ary( root.children ).forEach( function dd5e_Loader_load_each_top( e ) {
                  var obj = { source: source }, classification = e.tagName, id = e.getAttribute('id');
                  // Check duplication
                  if ( id ) {
                     var dup = res[classification].get({ id: id });
                     if ( dup.length > 0 ) {
                        _.warn( '[dd5e.Loader] Skipping redeclaraion of ' + classification + '.' + id + '. Already declared by ' + dup[0].source.id );
                        return;
                     }
                  }
                  // Create resource
                  switch ( classification ) {
                     case 'comment':
                        source.comment = e.innerHTML.trim();
                        break;
                     case 'entity':
                        _.ary( e.attributes ).forEach( function( an ) { obj[an.name] = an.value; } );
                        new base.Entity( obj );
                        break;
                     case 'character':
                        break;
                     case 'race':
                        break;
                     default:
                        _.warn("[dd5e.Loader] Unknown top level element in " + source.id + ": " + e.tagName + " (" + opt.url + ")" );
                  };
               } );
               opt.onres( source );
            } catch ( err ) {
               if ( opt.onerror ) opt.onerror( err ); else throw err;
            }
         }
      });
   }
}

})( dd5e );