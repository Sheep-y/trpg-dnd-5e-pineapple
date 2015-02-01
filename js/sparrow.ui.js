(function sparrrow_ui_init( _ ) { 'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab
/**
 *
 * sparrow.ui.js
 *
 * Sparrow - light weight HTML5 UI library, object oriented.  Only support latest browsers.
 *
 */

var ui = _.ui = _.map();
var symbol = ui.symbol = {
   '__proto__' : null,
   Dom : 'symbol_dom'
};
var dom_style; // <style> dom element

function _ui_addStyle ( id, style ) {
   if ( ! style ) return;
   if ( ! dom_style ) document.head.appendChild( dom_style = _.create( 'style' ) );
   else if ( _ui_addStyle[ id ] ) return;
   _.ary( style ).forEach( dom_style.sheet.insertRule.bind( dom_style.sheet ) );
   _ui_addStyle[ id ] = true;
}

function _ui_defaults ( component, opt ) {
   return _.extend( opt || {}, component.prototype.default_options );
}

/** The base UI component class */
ui.Component = {
   'create' : function ( opt ) {
      var me = _.newIfSame( this, ui.Component );
      _ui_addStyle( me.style_id, me.prototype.style );
      var dom = me.prototype.create_dom( opt );
      if ( dom ) {
         this[ symbol.Dom ] = dom;
         if ( opt.id ) dom.id = id;
         if ( opt.parent ) opt.parent.appendChild( dom );
      }
      if ( opt.visible === false ) me.hide();
      return me;
   },
   prototype : {
      'create_dom' : _.dummy,
      'default_options' : _.map(),
      'id' : '',
      'style' : ''
   },
   [symbol.Dom] : null,
   get dom ( ) { return this[ symbol.Dom ]; },
   get style ( ) { return this.dom.style; },
   get visible ( ) { return this.style.display !== 'none'; },
   set visible ( visible ) {
      visible = Boolean( visible );
      if ( visible === this.visible ) return;
      _[ visible ? 'show' : 'hide' ]( this.dom );
   },
   show ( ) { this.visible = true; },
   hide ( ) { this.visible = false; },
};

ui.Mask = {
   '__proto__' : ui.Component,
   'create' : function ( opt ) {
      var me = _.newIfSame( this, ui.Mask );
      ui.Component.create.call( me, opt = _ui_defaults( ui.Mask, opt ) );
      if ( opt.title ) me.header.textContent = opt.title;
      return me;
   },
   prototype : {
      'create_dom' ( ) { return _.html( '<div class="ui mask"></div>' ); },
      'default_options' : { 'visible': false, 'parent': document.body },
      'id' : 'mask',
      'style' :
`@media all {
   .ui.mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; /* Same size and position as parent */
      background: #444; opacity: 0.8; z-index: 100; /* And cover everything else */ }
}` }
};

ui.Dialog = {
   '__proto__' : ui.Component,
   'create' : function ( opt ) {
      var me = _.newIfSame( this, ui.Dialog );
      ui.Component.create.call( me, opt = _ui_defaults( ui.Dialog, opt ) );
      if ( opt.title ) me.header.textContent = opt.title;
      return me;
   },
   get title ( ) { return this.header.textContent; },
   set title ( title ) { this.header.textContent = title; },
   get header ( ) { return this.dom.firstChild.firstChild; },
   get body   ( ) { return this.header.nextSibling;   },
   get innerHTML ( ) { return this.body.innerHTML; },
   set innerHTML ( html ) { this.body.innerHTML = html; },
   get footer ( ) { return this.dom.firstChild.lastChild; },
   prototype : {
      'create_dom' ( ) { return _.html( '<dialog class="ui"><section><header></header><div></div><footer></footer></section></dialog>' ); },
      'default_options' : { 'visible': true, 'parent': document.body },
      'id' : 'dialog',
      'style' :
`@media all {
   !* > dialog.ui { transform-style: preserve-3d; } /* Prevent sub-pixel transform of dialog */
   dialog.ui {
      position: fixed; top: 50%; right: 0; left: 0; margin: 0 auto; transform: translateY(-50%); /* Vertical and horizontal center on screen */
      display: table; background: #EEE; /* Shrink to content size */
      border: 2px solid #444; border-radius: 5px; box-shadow: 5px 5px 5px #888; } /* Borders and shadow */
   dialog.ui > section { display: flex; flex-direction: column; min-width: 300px; min-height: 300px; } /* Dynamic content with dynamic sized header and footer */
   dialog.ui > section > * { padding: 5px; }
   dialog.ui > section > header {
      font-size: 125%; font-weight: bold; min-height: 1.5em;
      padding: 2px 5px; background: #BBB; border-bottom: 2px solid #444; } /* Header background colour */
   dialog.ui > section > div { flex: 1; overflow: auto; }
   dialog.ui > section > footer { text-align: right; }
}` }
};

})( _ );