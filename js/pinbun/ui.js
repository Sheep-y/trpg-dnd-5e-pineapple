var pinbun; // Globals
if ( ! pinbun ) throw new Error( '[dd5] Pineapplebun core must be loaded first.' );
else if ( ! pinbun.ui ) ( function pinbun_ui_init ( ns ) { 'use strict';

var panels = [], savedFocus, next_unique_id = 0;
var dlg_main = _.ui.Dialog.create( { title: 'Message', visible: false } ); // Main dialog

var ui = ns.ui = {
   '__proto__' : null,
   'panels' : panels,

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

   get activeCharacter ( ) {
      return ui.panels[0]._character; // Dummy support for singleton chargen panel
   },

   saveFocus ( ) {
      savedFocus = document.activeElement ? document.activeElement.id : null;
   },

   loadFocus ( ) {
      if ( ! savedFocus ) return;
      if ( document.activeElement && document.activeElement.id === savedFocus ) return;
      var e = _( '#' + savedFocus );
      if ( e.length ) e[0].focus();
   },

   newId ( ) {
      return 'pbui-' + next_unique_id++ ;
   },
};

pinbun.event.add( 'load', (e) => { ns.ui.openDialog( "Loaded: " + e ); } );
pinbun.event.load( 'pinbun.ui' );

})( pinbun );