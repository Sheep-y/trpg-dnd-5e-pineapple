var _, pinbun; // Globals
if ( ! _ || ! _.time ) throw new Error( '[dd5] Sprrow libirary must be loaded first.' );
else if ( ! pinbun ) ( function pinbun_core_init ( ns ) { 'use strict';

var log = ns.event = _.EventManager.create( [ 'load', 'l10n', 'error', 'warn', 'info', 'fine', 'finer', 'finest' ], ns );
ns.event.createFireMethods();

// setting window.onerror is preventing normal error reporting in console
//if ( window ) window.onerror = ( message, file, line, col, error ) => log.error( error || ( file ? file + " " + line : message ) );
log.add( 'load', ( e ) => log.info( 'Loaded: ' + e ) );
log.add( 'error', ( e, ex ) => {
   if ( ex && typeof( e ) === 'string' ) {
      ex.message = `${e} (${ex.message})`;
      e = ex;
   } else {
      e = typeof( e ) === 'object' ? e : new Error( e );
      if ( ex ) e.cause = ex;
   }
   _.error( e );
   if ( ns.ui ) ns.ui.openDialog( e );
});
log.add( 'warn', _.warn );
log.add( 'info', _.info );
log.add( 'fine', _.info );
//log.add( 'finer', _.info );
//log.add( 'finest', _.info );

var pnl_content = _( '#container' )[0];

ns.init = function pinbun_init ( source_url ) {
   log.add( 'warn', ns.ui.openDialog );
   _.attr( document.documentElement, { 'lang': _.l.detectLocale( 'en-US' ) } ); // Detect language and set document attribute
   _.l.localise();
   if ( source_url ) {
      dd5.loader.event.add( 'progress', e => ns.ui.openDialog( "Loaded: " + ( e.url || e ) ) );
      dd5.loader.event.add( 'load', ( e ) => {
         ns.ui.closeDialog();
         _.log( 'Finished loading. Creating character.' );
         _.time();
         var c = dd5.res.character.get('pc')[0].build();
         _.time( 'Character created. Building user interface.' );
         pnl_content.appendChild( ns.ui.Chargen.create( c ).dom );
         _.time( 'UI created.' );
      } );
      dd5.loader.load( source_url );
   }
};

pinbun.event.load( 'pinbun' );

})( pinbun = _.map() );