var pinbun; // Globals
if ( ! pinbun || ! pinbun.ui ) throw new Error( '[dd5] Pineapplebun UI module must be loaded first.' );
else if ( ! pinbun.ui.Chargen ) ( function pinbun_ui_chargen_init ( ns ) { 'use strict';

var ui = ns.ui;
var log = ns.event;

ui.Chargen = {
   'create' ( char ) {
      var that = _.newIfSame( this, ui.Chargen );
      var observer = that.refresh.bind( that );
      that._character = char;
      that._dom = _.create( 'div', { id : ui.newId() } );
      char.observers.add( 'structure', observer );
      log.add( 'l10n', observer );
      ui.panels.push( that );
      that.refresh();
      return that;
   },
   '_dom' : null,
   '_character' : null,
   get dom() { return this._dom; },

   'refresh' : function pinbun_Chargen_refresh ( ) {
      var dom = this.dom;
      ui.saveFocus();
      _.clear( dom )[0].appendChild( this._character.createUI( 'edit', dom ) );
      ui.loadFocus();
   },
   'destroy' : function pinbun_Chargen_destroy ( ) {
      var pos = ui.panels.indexOf( this );
      if ( pos ) ui.panels.splice( pos, 1 );
      log.remove( 'l10n', this._refresh );
      char.observers.remove( 'structure', this._refresh );
   }
};

log.load( 'pinbun.ui.chargen' );

})( pinbun );