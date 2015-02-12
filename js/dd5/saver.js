var dd5; // Globals
if ( ! dd5 ) throw new Error( '[dd5.saver] 5e core module must be loaded first.' );
else if ( ! dd5.saver ) ( function dd5_saver_init ( ns ) { 'use strict';

var sys = ns.sys;
var res = ns.res;
var log = ns.event;

var saver = ns.saver = {
   save : function ( root ) {
      var result = { root: [ root.res_type, root.id ], data: [] };
      root.recur( null, ( e ) => {
         if ( ! e.save ) return;
         var s = e.save( 'json' );
         if ( s ) data[ e.getPath() ] = s;
         if ( e.afterSave ) e.afterSave();
      } );
      console.log( JSON.stringify( result ) );
   },
};

pinbun.event.load( 'dd5.saver' );

})( dd5 );