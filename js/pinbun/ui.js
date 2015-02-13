var pinbun; // Globals
if ( ! pinbun ) throw new Error( '[dd5] Pineapplebun core must be loaded first.' );
else if ( ! pinbun.ui ) ( function pinbun_ui_init ( ns ) { 'use strict';

var panels = [], next_unique_id = 0;
var dlg_main = _.ui.Dialog.create( { visible: false } ); // Main dialog
var savedFocus, savedScrollX, savedScrollY, currentTheme;

var ui = ns.ui = {
   __proto__ : null,
   panels : panels,
   get theme ( ) { return currentTheme; },
   get locale ( ) { return _.l.currentLocale; },

   init ( ) {
      _.l.saveKey = 'pinbun.locale';
      _.l.detectLocale( 'en-US' ); // Detect language
      _.l.localise();  // Localise and set document attribute
      currentTheme = ui.Global.create();
      ui.setTheme( _.pref( 'pinbun.theme' ) );
   },

   setTheme ( theme ) {
      var e = ns.themes.find( e => e.code && e.code === theme );
      if ( e ) {
         _.attr( 'menuitem[data-theme]:checked', 'checked', null );
         _.attr( `menuitem[data-theme="${theme}"]`, 'checked', 'checked' );
         _.prop( `link.page_style:not([data-theme="${theme}"])`, { disabled: true } );
         _.prop( `link.page_style[data-theme="${theme}"]`, { disabled: false } );
         _.setImmediate( () => _.prop( 'link.page_style[disabled]', { disabled: false } ) );
         currentTheme = theme;
         _.pref.set( 'pinbun.theme', theme );
      }
   },

   setLocale ( locale ) {
      var e = ns.locales.find( e => e.code && e.code === locale );
      if ( e ) {
         _.attr( '#btn_locale', 'text', e.label );
         _.attr( 'menuitem[data-locale]:checked', 'checked', null );
         _.attr( `menuitem[data-locale="${locale}"]`, 'checked', 'checked' );
         _.l.saveLocale( locale );
         _.l.localise();
         ui.setTheme ( ui.theme ); // On Firefox, changing link title will invalidate that stylesheet, so need to re-set the theme
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