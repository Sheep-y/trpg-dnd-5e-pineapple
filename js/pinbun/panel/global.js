var pinbun; // Globals
if ( ! pinbun || ! pinbun.ui ) throw new Error( '[dd5] Pineapplebun UI module must be loaded first.' );
else if ( ! pinbun.ui.Global ) ( function ui_global_init ( ns ) { 'use strict';

var ui = ns.ui;
var log = ns.event;

var menu_shown = false;

ui.Global = {
   create () {
      if ( ui.panels.includes( this ) ) return;
      ui.panels.push( this );

      var menu = _( '#mnu_lang' )[0], item;
      for ( var lang of ns.lang ) {
         if ( lang === '-' ) {
            item = _.create( 'hr' );
         } else {
            item = _.create( 'menuitem', { label: lang.name, 'data-lang': lang.code, onclick: evt => ui.setLocale( evt.target.dataset.lang ) } );
            if ( lang.icon ) item.icon = lang.icon;
            if ( lang.code === _.l.currentLocale ) {
               item.checked = 'checked';
               _.attr( '#btn_lang', 'text', lang.label );
            }
         }
         menu.appendChild( item );
      }
      _.attr( '#btn_lang', { onshow: this.mnu_show, onclick: this.mnu_lang_click } );
   },

   mnu_show ( evt ) {
      menu_shown = true; // Tell menu button click events that menu is shown.
   },

   mnu_lang_click ( evt ) {
      menu_shown = false;
      setTimeout( () => {
         if ( menu_shown ) return; // If menu is working, then we will pass.
         var found, target, current = _.l.currentLocale;
         for ( var lang of ns.lang ) {
            if ( typeof( lang ) === 'string' ) continue; // e.g. separator
            if ( ! target ) target = lang.code; // Default to first option, if not found or looped around
            if ( lang.code === current ) {
               found = true;
            } else if ( found ) {
               target = lang.code;
               break;
            }
         }
         if ( target ) ui.setLocale( target );
      }, 50 );
   },
};

log.load( 'pinbun.ui.global' );

})( pinbun );