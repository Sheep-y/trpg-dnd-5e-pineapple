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

      var menu = _( '#mnu_theme' )[0], dom, item;
      menu = _( '#mnu_theme' )[0];
      for ( item of ns.themes ) {
         if ( item === '-' ) {
            dom = _.create( 'hr' );
         } else {
            var code = item.code, i18n = `pinbun.theme.${code}`, txt = _.l( i18n );
            dom = _.create( 'menuitem', { label: txt, class: 'i18n', 'data-i18n': i18n, 'data-theme': code, onclick: evt => ui.setTheme( evt.target.dataset.theme ) } );
            if ( item.icon ) dom.icon = item.icon;

            var file = item.files.css;
            var css  = _( `link[href="${file}"]` );
            var attr = { title: txt, class: 'i18n page_style', 'data-i18n': i18n, 'data-theme': code };
            if ( ! css.length ) {
               css = _.create( 'link', _.extend( attr, { rel: 'alternate stylesheet', href: item.files.css } ) );
               document.head.appendChild( css );
            } else {
               _.attr( css, attr ); // If exists, set title and class
               ui.theme = code;
               dom.checked = 'checked';
            }

            for ( file in item.files.res ) {
               document.head.insertAdjacentHTML( 'beforeend', `<link rel='prefetch' href='${file}' />` );
            }
         }
         menu.appendChild( dom );
      }
      _.attr( '#btn_theme', { onshow: this.mnu_show, onclick: this.mnu_theme_click } );

      menu = _( '#mnu_locale' )[0];
      for ( item of ns.locales ) {
         if ( item === '-' ) {
            dom = _.create( 'hr' );
         } else {
            dom = _.create( 'menuitem', { label: item.name, 'data-locale': item.code, onclick: evt => ui.setLocale( evt.target.dataset.locale ) } );
            if ( item.icon ) dom.icon = item.icon;
            if ( item.code === _.l.currentLocale ) {
               dom.checked = 'checked';
               _.attr( '#btn_locale', 'text', item.label );
            }
         }
         menu.appendChild( dom );
      }
      _.attr( '#btn_locale', { onshow: this.mnu_show, onclick: this.mnu_locale_click } );
   },

   mnu_show ( evt ) {
      menu_shown = true; // Tell menu button click events that menu is shown.
   },

   mnu_theme_click ( evt ) {
      if ( evt.button >= 1 ) return;
      menu_shown = false;
      setTimeout( () => {
         if ( menu_shown ) return;
         ui.setTheme( find_next_by_code( ns.themes, ui.theme ) );
      }, 50 );
   },

   mnu_locale_click ( evt ) {
      if ( evt.button >= 1 ) return;
      menu_shown = false;
      setTimeout( () => {
         if ( menu_shown ) return;
         ui.setLocale( find_next_by_code( ns.locales, ui.locale ) );
      }, 50 );
   },
};

function find_next_by_code( list, current ) {
   var candidates = _.array( list ).filter( e => e.code );
   if ( candidates.length <= 0 ) return current;
   var pos = candidates.findIndex( e => e.code === current );
   return pos >= 0 && pos < candidates.length-1
      ? candidates[ pos+1 ].code
      : candidates[ 0 ].code;
}

log.load( 'pinbun.ui.global' );

})( pinbun );