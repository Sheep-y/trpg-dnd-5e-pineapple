/*                                                                                                                      <![CDATA[ ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab */
var pinbun; // Globals
if ( ! pinbun || ! pinbun.ui ) throw Error( '[dd5] Pineapplebun UI module must be loaded first.' );
else if ( ! pinbun.ui.Chargen ) ( function ui_chargen_init ( ns ) { 'use strict';

var ui = ns.ui;
var symbol = _.ui.symbol;
var log = ns.event;

var refresh_timer = 0;

ui.Chargen = {
   '__proto__' : _.ui.Component,
   'create' ( char ) {
      var me = _.newIfSame( this, ui.Chargen );
      me.refresh = me.refresh.bind( me );
      me._character = char;
      me[ symbol.Dom ] = _.create( 'div', { class: 'pbui panel chargen', id : ui.newId() } );
      char.addObserver( 'structure', me.refresh );
      log.add( 'l10n', me.refresh );
      ui.panels.push( me );
      me.refresh();
      return me;
   },
   '_character' : null,

   'refresh' ( ) {
      if ( refresh_timer ) return;
      refresh_timer = _.setImmediate( () => {
         try {
            ui.saveFocus();
            _.clear( this.dom )[0].appendChild( this._character.createUI( 'edit', this.dom ) );
            ui.loadFocus();
         } finally {
            refresh_timer = 0;
         }
      } );
   },

   'destroy' ( ) {
      var pos = ui.panels.indexOf( this );
      if ( pos ) ui.panels.splice( pos, 1 );
      log.remove( 'l10n', this.refresh );
      char.removeObserver( 'structure', this.refresh );
   }
};

log.load( 'pinbun.ui.chargen' );

})( pinbun );/*]]>*/