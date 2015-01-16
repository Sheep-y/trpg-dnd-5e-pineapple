(function sparrrow_ui_init( _ ) { 'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab
/**
 *
 * sparrow.ui.js
 *
 * Sparrow - light weight HTML5 UI library, object oriented.  Only support latest browsers.
 *
 */

var ui = _.ui = Object.create( null );
var dom_style; // <style> dom element

var symbol_create = 'symbol_create';
var symbol_style  = 'symbol_style';
var symbol_default = 'symbol_default';
var symbol_dom = 'symbol_dom';

function _ui_addStyle ( id, style ) {
   if ( ! style ) return;
   if ( ! dom_style ) document.head.appendChild( dom_style = _.create( 'style' ) );
   else if ( _ui_addStyle[ id ] ) return;
   _.ary( style ).forEach( dom_style.sheet.insertRule.bind( dom_style.sheet ) );
   _ui_addStyle[ id ] = true;
}

function _ui_defaults ( that, opt ) {
   return _.extend( opt || {}, that.default_options );
}

/** The base UI component class */
ui.Component = {
   'create' : function ( opt ) {
      var that = _.newIfSame( this, ui.Component );
      _ui_addStyle( that.style_id, that.style );
      var dom = that.create_dom( opt );
      if ( dom ) {
         this[ symbol_dom ] = dom;
         if ( opt.id ) dom.id = id;
         if ( opt.parent ) opt.parent.appendChild( dom );
         if ( 'zIndex' in opt ) dom.style.zIndex = opt.zIndex;
      }
      if ( opt.visible === false ) that.hide();
      return that;
   },
   'symbol_default' : () => Object.create( null ),
   'symbol_create' : _.dummy,
   'symbol_style' : () => '',
   'symbol_dom' : null,
   get dom ( ) { return this[ symbol_dom ]; },
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

ui.Dialog = {
   '__proto__' : ui.Component,
   'create' : function ( opt ) {
      var that = _.newIfSame( this, ui.Dialog );
      ui.Component.create.call( that, opt = _ui_defaults( ui.Dialog, opt ) );
      if ( opt.title ) that.header.textContent = opt.title;
      return that;
   },
   get title ( ) { return this.header.textContent; },
   set title ( title ) { this.header.textContent = title; },
   get header ( ) { return this.dom.firstChild.firstChild; },
   get body   ( ) { return this.header.nextSibling;   },
   get innerHTML ( ) { return this.body.innerHTML; },
   set innerHTML ( html ) { this.body.innerHTML = html; },
   get footer ( ) { return this.dom.firstChild.lastChild; },
   create_dom ( ) { return _.html( '<dialog class="sparrow-ui"><form><header></header><div></div><footer></footer></form></dialog>' ); },
   default_options : { 'visible': true, 'parent': document.body },
   style_id : 'dialog',
   style :
`@media all {
   !* > dialog.sparrow-ui { transform-style: preserve-3d; } /* Prevent sub-pixel transform of dialog */
   dialog.sparrow-ui {
      position: fixed; top: 50%; right: 0; left: 0; margin: 0 auto; transform: translateY(-50%); /* Vertical and horizontal center on screen */
      display: table; background: #EEE; /* Shrink to content size */
      border: 2px solid #444; border-radius: 5px; box-shadow: 5px 5px 5px #888; } /* Borders and shadow */
   dialog.sparrow-ui > form { display: flex; flex-direction: column; min-width: 300px; min-height: 300px; } /* Dynamic content with dynamic sized header and footer */
   dialog.sparrow-ui > form > * { padding: 5px; }
   dialog.sparrow-ui > form > header {
      font-size: 125%; font-weight: bold; min-height: 1.5em;
      padding: 2px 5px; background: #BBB; border-bottom: 2px solid #444; } /* Header background colour */
   dialog.sparrow-ui > form > div { flex: 1; overflow: auto; }
   dialog.sparrow-ui > form > footer { text-align: right; }
}`};

})( _ );