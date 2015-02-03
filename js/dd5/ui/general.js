var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw new Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.subrule.slot' ) ) ( function dd5_ui_general_init ( ns ) { 'use strict';

var sys = ns.sys;
var ui = ns.ui;

var slotEditor = {
   'edit' ( e, container ) {
      if ( e.count === null || e.can_duplicate() === true ) return dd5_ui_edit_slot_selectbox( e, container );
      else return dd5_ui_edit_slot_multiple( e, container );
   }
};
ui.registerFactory( 'subrule.slot', slotEditor );
ui.registerFactory( 'subrule.profslot', slotEditor );

function dd5_ui_edit_slot_selectbox ( e, container ) {
   // For single choice or duplicatable Slots. Create one select boxes for each choice.
   var { id } = ui._getId( e, container );
   var nullPick = sys.Option.create({ 'cid': '', 'toString': ()=>'', 'getName': ()=>'' });
   var picks = _.ary( e.getPick() ) || [];
   var count = e.count ? e.count( 'ui' ) : 1;
   var frag = document.createDocumentFragment();

   function getPick ( i ) {
      var pick = _.ary( e.getPick() );
      if ( ! pick || pick.length <= i ) return nullPick.value;
      return _.coalesce( pick[ i ], nullPick.value );
   }

   for ( var i = 0 ; i < count ; i++ ) ( function slot_each ( i ) {
      var pick = picks[ i ] || nullPick.value;
      var html = `<div><label class='dd5 slot'><span>${ e.getLabel() }</span>`;
      html = _.html( html + `<select id='${id}/${i}'><option value='${ pick.cid }'>${ pick.getName() }</option></select></label></div>` );

      var input = _( html, 'select' )[ 0 ];
      // Update slot on change
      input.addEventListener( 'change', function slot_change ( ) {
         var pick = getPick( i );
         if ( input.value === pick.cid ) return;
         if ( input.value === '' ) e.setPick( null );
         else e.setPick( i, e.getCompatibleOptions().find( e => e.cid === input.value ) || null );
      } );
      // Add options on focus
      input.addEventListener( 'focus', function slot_focus ( ) { // Expand options
         var pick = getPick( i ), opt = [ nullPick ].concat( e.getOptions() );
         var selected = input.firstChild;
         opt.forEach( function slot_focus_each_option ( e ) {
            if ( e.value.cid !== pick.cid ) {
               var o = _.create( 'option', { value: e.value.cid, 'text': e.value.getName() } );
               if ( ! e.valid ) o.disabled = 'disabled';
               if ( e.note ) o.title = e.note;
               input.insertBefore( o, selected );
            } else {
               selected = null;
            }
         } );
      } );
      // Delete options on blur
      input.addEventListener( 'blur' , function slot_blur ( ) {
         for ( var c of _.ary( input.childNodes ) ) {
            if ( ! c.selected ) input.removeChild( c );
         }
      } );
      if ( pick.cid ) {
         var child = ui.createUI( pick, 'edit', container );
         if ( child ) html.appendChild( child );
      }
      pick = container = null; // minimise closure reference
      frag.appendChild( html );
   } )( i );
   if ( ! frag.children.length ) return null;
   if ( frag.children.length === 1 ) return frag.firstChild;
   return _.create( 'div' , { 'children' : frag } );
}

function dd5_ui_edit_slot_multiple ( rule, container ) {
   // For multiple choice (non-duplicatable) Slots.  Create one checkbox for each option.
   var options = rule.getOptions();
   if ( ! options || ! options.length ) return;
   var { id } = ui._getId( rule, container ), count = rule.count( 'ui' );
   var picks = _.ary( rule.getPick() ) || [];
   if ( picks.length ) picks = picks.filter( e => e );
   var html = _.html( `<div><label class='dd5 slot'><span>${ rule.getLabel() }</span></label></div>` );
   options.forEach( ( opt, i ) => {
      var picked = picks.find( p => p && p.cid === opt.value.cid );
      if ( picks.length !== count || picked ) {
         var e = opt.value;
         var attr = opt.valid ? '' : ' disabled="disabled"';
         if ( opt.note ) attr += ` title="${_.escHtml( opt.note )}"`;
         if ( picked ) attr += ' checked="checked"';
         var label = _.html( `<label><input id='${id}/${e.cid}' type='checkbox' ${attr}><span>${ e.getName() }</span></label>` );
         _( label, 'input' )[0].addEventListener( 'change', function slot_multiple_change ( evt ) {
            var picks = _.ary( rule.getPick() ) || [];
            if ( evt.target.checked ) { // Add choice
               for ( var i = 0 ; i < picks.length ; i++ )
                  if ( ! picks[ i ] ) break;
               rule.setPick( i, e );
            } else {
               var pos = picks.findIndex( p => p && p.cid === e.cid );
               if ( pos >= 0 ) rule.setPick( pos, null );
            }
         } );
         html.appendChild( label );
      }
   } );
   return html;
}

ui.registerFactory( 'subrule.numslot', {
   'edit' ( e, container ) {
      var { id } = ui._getId( e, container );
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