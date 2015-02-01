var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw new Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.subrule.slot' ) ) ( function dd5_ui_general_init ( ns ) { 'use strict';

var ui = ns.ui;

var slotEditor = {
   'edit' ( e, container ) {
      var uid = container.id, uid = container.id, id = `${uid}/edit/${_.escHtml(e.getPath())}`;
      var html = `<div><label class='dd5 slot'><span>${ e.getLabel() }</span>`;
      var nullPick = { 'cid': '', 'toString': ()=>'', 'getName': ()=>'' }, pick = _.coalesce( e.getPick(), nullPick );
      html = _.html( html + `<select id='${id}'><option value='${ pick.cid }'>${ pick.getName() }</option></select></label></div>` );

      var input = _( html, 'select' )[ 0 ];
      // Update slot on change
      input.addEventListener( 'change', function dd5_ui_edit_slot_change( ) {
         if ( input.value === '' ) e.setPick( null );
         else e.setPick( e.options().filter( o => o.cid === input.value )[ 0 ] || null );
      } );
      // Add options on focus
      input.addEventListener( 'focus', function dd5_ui_edit_slot_focus( ) { // Expand options
         var pick = _.coalesce( e.getPick(), nullPick ), opt = [ nullPick ].concat( e.getOptions() );
         var selected = input.firstChild;
         opt.forEach( function dd5_ui_edit_slot_focus_each ( e, i ) {
            var o = _.create( 'option', { value: e.cid, 'text': e.getName() } );
            if ( e.cid !== pick.cid ) input.insertBefore( o, selected );
            else selected = null;
         } );
      } );
      // Delete options on blur
      input.addEventListener( 'blur' , function dd5_ui_edit_slot_blur ( ) {
         for ( var c of _.ary( input.childNodes ) ) {
            if ( ! c.selected ) input.removeChild( c );
         }
      } );

      for ( var c of e.children ) {
         var child = ui.createUI( c, 'edit', container );
         if ( child ) html.appendChild( child );
      }
      pick = container = null; // minimise closure reference
      return html;
   }
};
ui.registerFactory( 'subrule.slot', slotEditor );
ui.registerFactory( 'subrule.profslot', slotEditor );

ui.registerFactory( 'subrule.numslot', {
   'edit' ( e, container ) {
      var uid = container.id, uid = container.id, id = `${uid}/edit/${_.escHtml(e.getPath())}`;
      var html = `<div><label class='dd5 slot'><span>${ e.getLabel() }</span>`;
      html = _.html( html + `<input id='${id}' type='number' min='${ e.getMinVal() }' max='${ e.getMaxVal() }' value='${ e.getPick() }' data-attr='${ e.id }' /></label></div>` );

      // Update slot on change
      _( html, 'input' )[ 0 ].addEventListener( 'change', function dd5_ui_edit_numslot_onchange ( ) { rule.setPick( +e.value ); } );

      for ( var c of e.children ) {
         var child = ui.createUI( c, 'edit', container );
         if ( child ) html.appendChild( child );
      }
      container = null;
      return html;
   }
} );

ui.registerFactory( 'subrule.prof', {
   'edit' ( e, container ) {
      var val = '';
      e.value().forEach( (v) => val += `<span>${ v.getName() }</span>` );
      return _.html( `<div><label class='dd5 prof'><span> ${ e.getLabel() }</span> ${val} </label></div>` )
   }
} );

pinbun.event.load( 'dd5.ui.general' );

})( dd5 );