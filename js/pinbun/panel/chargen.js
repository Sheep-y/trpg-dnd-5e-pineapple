var pinbun; // Globals
if ( ! pinbun || ! pinbun.ui ) throw new Error( '[dd5] Pineapplebun UI module must be loaded first.' );
else if ( ! pinbun.ui.Chargen ) ( function pinbun_ui_chargen_init ( ns ) { 'use strict';

var ui = ns.ui;
var symbol = _.ui.symbol;
var log = ns.event;

ui.Chargen = {
   '__proto__' : _.ui.Component,
   'create' ( char ) {
      var that = _.newIfSame( this, ui.Chargen );
      var observer = that.refresh.bind( that );
      that._character = char;
      that[ symbol.Dom ] = _.create( 'div', { id : ui.newId() } );
      char.addObserver( 'structure', observer );
      log.add( 'l10n', observer );
      ui.panels.push( that );
      that.refresh();
      return that;
   },
   '_character' : null,

   'refresh' ( ) {
      ui.saveFocus();
      _.clear( this.dom )[0].appendChild( this._character.createUI( 'edit', this.dom ) );
      ui.loadFocus();
   },
   'destroy' ( ) {
      var pos = ui.panels.indexOf( this );
      if ( pos ) ui.panels.splice( pos, 1 );
      log.remove( 'l10n', this._refresh );
      char.removeObserver( 'structure', this._refresh );
   }
};

log.load( 'pinbun.ui.chargen' );

})( pinbun );