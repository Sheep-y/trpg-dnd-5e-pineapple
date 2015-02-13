var dd5; // Globals
if ( ! dd5 ) throw new Error( '[dd5] dd5 core module must be loaded first.' );
else if ( ! dd5.ui ) ( function dd5_ui_slot_init ( ns ) { 'use strict';

var sys = ns.sys;
var log = ns.event;

var registry = _.map();
var component_map = _.map();
var component_symbol = 0;

var ui = ns.ui = {
   '__proto__' : null,

   registerFactory ( cid, factory ) {
      registry[ cid ] = factory;
   },
   unregisterFactory ( cid, factory ) {
      delete registry[ cid ];
   },
   registered ( cid ) {
      return registry[ cid ] ? true : false;
   },

   createUI ( component, type, container ) {
      var domlist = [], result, cid = component.cid;
      var factory = registry[ cid ];
      if ( factory && factory[ type ] )
         result = factory[ type ]( component, container );
      if ( result ) {
         result.dataset.cid = cid;
         result.dataset.uitype = type;
      } else {
         for ( var c of component.children ) {
            var child = ui.createUI( c, type, container );
            if ( child ) domlist.push( child );
         }
      }
      if ( ( result ? 1 : 0 ) + domlist.length > 1 ) {
         if ( ! result ) result = _.create( 'div' );
         for ( var e of domlist ) result.appendChild( e );
      } else
         if ( ! result ) result = domlist[ 0 ];
      return result;
   },

   _update_attribute ( component, root ) {
      for ( var e of _( root, '*[data-attr]' ) ) {
         var value = component.queryChar( e.dataset.attr, 'ui' );
         if ( e.dataset.format === 'bonus' ) value = sys.formatBonus( +value );
         if ( e.tagName === 'INPUT' ) {
            if ( e.value !== value ) e.value = value;
         } else {
            if ( e.textContent !== value ) e.textContent = value;
         }
      };
   },

   _hook_attribute ( component, html, updater ) {
      var char = component.getCharacter(), body = document.body;
      if ( ! updater ) updater = ui._update_attribute.bind( null, char, html );
      char.addObserver( 'attribute', updater );
      var destructor = new MutationObserver( ( mutations ) => { // If the last input is no longer attached, unhook updater.
         for ( var m of mutations ) if ( m.removedNodes && m.removedNodes.length ) {
            if ( ! _.html.contains( body, html ) ) char.removeObserver( 'attribute', updater );
            return; // Only need to check existence once, by the time the observer triggers.
         }
      } );
      destructor.observe( body, { childList: true, subtree: true } );
      return html;
   },

   _getId( component, container ) {
      var path = component.getPath();
      return {
         path,
         id : `${container.id}/edit/${_.escHtml(path)}`,
      };
   },
};

pinbun.event.load( 'dd5.ui' );

})( dd5 );