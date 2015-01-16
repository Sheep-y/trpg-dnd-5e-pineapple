var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw new Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.subrule.slot' ) ) ( function dd5_ui_general_init ( ns ) { 'use strict';

var ui = ns.ui;

ui.registerFactory( 'subrule.slot', {
   'edit' ( e, container ) {
      var uid = container.id;

      var label = _.l( 'dd5.slot.' + e.getPath(), null ) || _.l( 'dd5.attribute.' + e.id );
      var html = '<div><label class="dd5 slot">' + label; //, path = uid + '_edit_' + _.escHtml( rule.getPath() ).replace( /\//g, '-' );
      if ( e.minVal && e.maxVal ) {
         html = _.html( html + '<input type="number" min="' + e.minVal( 'ui' ) + '" max="' + e.maxVal( 'ui' ) + '" value="' + e.getPick( 'ui' ) + '" data-attr="' + e.id + '" /></label></div>' );
         _( html, 'input' )[ 0 ].addEventListener( 'change', function dd5_ui_edit_slot_onchange ( ) { rule.setPick( +e.value ); } );
      } else {
         var nullPick = { 'cid': '', 'toString': ()=>'', 'getName': ()=>'' }, pick = _.coalesce( e.getPick(), nullPick );
         html = _.html( html + '<select><option value="' + pick.cid + '">' + pick.toString( 'ui' ) + '</option></select></label></div>' );
         var input = _( html, 'select' )[ 0 ];
         input.addEventListener( 'change', function dd5_ui_edit_slot_change( ) {
            if ( input.value === '' ) e.setPick( null );
            else e.setPick( e.options( 'ui' ).filter( o => o.cid === input.value )[ 0 ] || null );
         } );
         input.addEventListener( 'focus', function dd5_ui_edit_slot_focus( ) { // Expand options
            var pick = _.coalesce( e.getPick(), nullPick ), opt = [ nullPick ].concat( e.options( 'ui' ) );
            _.clear( input );
            opt.forEach( function dd5_ui_edit_slot_focus_each ( e, i ) {
               var o = _.create( 'option', { value: e.cid, 'text': e.getName( 'ui' ) } );
               if ( e.cid === pick.cid ) o.selected = true;
               input.appendChild( o );
            } );
         } );
         input.addEventListener( 'blur' , function dd5_ui_edit_slot_blur ( ) {
            for ( var c of input.childNodes ) {
               if ( ! c.selected ) input.removeChild( c );
            };
         } );
         pick = null; // minimise closure reference
      }

      for ( var c of e.children ) {
         var child = ui.createUI( c, 'edit', container );
         if ( child ) html.appendChild( child );
      }

      return html;
   }
} );

pinbun.event.load( 'dd5.ui.general' );

})( dd5 );