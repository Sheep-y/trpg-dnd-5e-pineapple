var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw new Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.feature.pc_ability' ) ) ( function dd5_ui_special_init ( ns ) { 'use strict';

var ui = ns.ui;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule;

ui.registerFactory( 'feature.pc_ability', {
   'edit' ( rule, container ) {
      var list = [], uid = container.id;
      var l10n = 'dd5.feature.pc_ability.';

      var html = `<div class="dd5 pc_ability"><table><caption>${ _.l( l10n + 'caption' ) }</caption><thead>
         <tr><th></th><th></th><th>${ _.l( l10n + 'final' ) }</th><th>${ _.l( l10n + 'modifier' ) }</th><th>${ _.l( l10n + 'check' ) }</th><th>${ _.l( l10n + 'save' ) }</th>
         </thead><tbody>`;
      rule.children.forEach( e => {
         if ( ! subrule.Slot.isPrototypeOf( e ) ) return;
         var id = e.id, path = uid + '_edit_' + _.escHtml( e.getPath() ).replace( /\//g, '-' );
         html += `<tr><th><label for="${path}">${ _.l( 'dd5.attribute.' + id, id.toUpperCase() ) }</label></th>
            <td><input type="number" id="${path}" data-attr="${id}" data-atlevel="0" step="1" min="${ e.minVal('ui') }" max="${ e.maxVal('ui') }" /></td>
            <td data-attr="${id}"></td><td data-attr="${id}_mod"  data-format="bonus"></td>
            <td data-attr="${id}_chk" data-format="bonus"></td><td data-attr="${id}_save" data-format="bonus"></td></tr>`;
         list.push( e );
      } );
      html += '</tbody></table></div>';
      html = _.html( html );

      ui._update_attribute( rule, html ); // Update values, and then setup input listener
      _.forEach( _( html, 'input' ), ( e, i ) => e.addEventListener( 'change', function dd5ui_edit_feature_pc_ability_onchange ( ) {
         list[ i ].setPick( +e.value ); // This should trigger the attribute update event and thus updater
      } ) );

      return ui._hook_attribute( rule, html );
   }
} );

pinbun.event.load( 'dd5.ui.special' );

})( dd5 );