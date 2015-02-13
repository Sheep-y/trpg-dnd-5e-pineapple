var pinbun; // Globals
if ( ! pinbun ) throw new Error( '[dd5] Pineapplebun core must be loaded first.' );
else if ( ! pinbun.ui ) ( function pinbun_ui_init ( ns ) { 'use strict';

var panels = [], next_unique_id = 0;
var dlg_main = _.ui.Dialog.create( { visible: false } ); // Main dialog
var savedFocus, savedScrollX, savedScrollY;

var ui = ns.ui = {
   __proto__ : null,
   panels : panels,
   theme : '', // Set by Global.create
   get locale ( ) { return _.l.currentLocale; },

   init ( ) {
      _.l.detectLocale( 'en-US' ); // Detect language
      _.l.localise();  // Localise and set document attribute
      ui.Global.create();
   },

   setTheme ( theme ) {
      for ( var e of ns.themes ) {
         if ( e.code && e.code === theme ) {
            _.log( 'switching to ' + theme );
            _.attr( 'menuitem[data-theme]:checked', 'checked', null );
            _.attr( `menuitem[data-theme="${theme}"]`, 'checked', 'checked' );
            _.forEach( _( `link.page_style:not([data-theme="${theme}"])` ), e => e.disabled = true );
            _( `link.page_style[data-theme="${theme}"]` )[0].disabled = false;
            _.setImmediate( () => _.forEach( _( 'link.page_style[disabled]' ), e => e.disabled = false ) );
            ui.theme = theme;
            break;
         }
      }
   },

   setLocale ( locale ) {
      for ( var e of ns.locales ) {
         if ( e.code && e.code === locale ) {
            _.attr( '#btn_locale', 'text', e.label );
            _.attr( 'menuitem[data-locale]:checked', 'checked', null );
            _.attr( `menuitem[data-locale="${locale}"]`, 'checked', 'checked' );
            _.l.setLocale( locale );
            _.l.localise();
            break;
         }
      }
   },

   /** Set or add to dialog panel and pop it up */
   openDialog ( content ) {
      content = '<div>' + content + '</div>';
      if ( ! dlg_main.visible || ui.closeDialog.timeout ) {
         dlg_main.innerHTML = content;
         dlg_main.show();
      } else {
         dlg_main.body.insertAdjacentHTML( 'beforeend', content );
      }
   },

   /** Close and clear dialog panel */
   closeDialog ( content ) {
      if ( ! dlg_main.visible ) return;
      dlg_main.hide();
      dlg_main.innerHTML = '';
   },

   saveFocus ( ) {
      savedFocus = document.activeElement ? document.activeElement.id : null;
      [ savedScrollX, savedScrollY ] = [ window.scrollX, window.scrollY ];
   },

   loadFocus ( ) {
      if ( ! savedFocus ) return;
      if ( document.activeElement && document.activeElement.id === savedFocus ) return;
      var e = document.getElementById( savedFocus );
      if ( e ) {
         e.focus();
         window.moveTo( savedScrollX, savedScrollY );
      }
   },

   newId ( ) {
      return 'pbui-' + next_unique_id++ ;
   },
};

pinbun.event.add( 'load', e => ns.ui.openDialog( "Loaded: " + e ) );
pinbun.event.load( 'pinbun.ui' );

})( pinbun );