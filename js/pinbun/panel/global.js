var pinbun; // Globals
if ( ! pinbun || ! pinbun.ui ) throw new Error( '[dd5] Pineapplebun UI module must be loaded first.' );
else if ( ! pinbun.ui.Global ) ( function ui_global_init ( ns ) { 'use strict';

var ui = ns.ui;
var log = ns.event;

ui.Global = {
   'create' () {
      if ( ui.panels.includes( this ) ) return;
      ui.panels.push( this );

      var menu = _( '#mnu_lang' )[0], item;
      for ( var lang of ns.lang ) {
         if ( lang === '-' ) {
            item = _.create( 'hr' );
         } else {
            item = _.create( 'menuitem', { label: lang.name, 'data-lang': lang.code, onclick: () => alert('Not implemented, lacks browser support') } );
            if ( lang.icon ) item.icon = lang.icon;
            if ( lang.code === _.l.currentLocale ) {
               item.checked = 'checked';
               _.attr( '#btn_lang', 'text', lang.label );
            }
         }
         menu.appendChild( item );
      }
      _.attr( '#btn_lang', 'onclick', this.mnu_lang_click );
   },
   'mnu_lang_click' ( evt ) {
      var found, target, current = _.l.currentLocale;
      for ( var lang of ns.lang ) {
         if ( lang === '-' ) continue;
         if ( ! target ) target = lang;
         if ( lang.code === current ) {
            found = true;
         } else if ( found ) {
            _.attr( 'menuitem:checked', 'checked', null );
            _.attr( `menuitem[data-lang="${lang.code}"]`, 'checked', 'checked' );
            target = lang;
            break;
         }
      }
      if ( target ) {
         _.attr( '#btn_lang', 'text', target.label );
         _.l.setLocale( target.code );
         _.l.localise();
      }
   },
};

log.load( 'pinbun.ui.global' );

})( pinbun );