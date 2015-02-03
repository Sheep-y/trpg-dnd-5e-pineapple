var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw new Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.feature.pc_ability' ) ) ( function dd5_ui_special_init ( ns ) { 'use strict';

var ui = ns.ui;
var res = ns.res;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule;

ui.registerFactory( 'feature.pc_ability', {
   'edit' ( rule, container ) {
      var list = [];
      var l10n = 'dd5.feature.pc_ability.';

      // Ability table captions
      var html = `<div class="dd5 pc_ability"><table><caption>${ _.l( l10n + 'caption' ) }</caption><thead>
         <tr><th></th><th></th><th>${ _.l( l10n + 'final' ) }</th><th>${ _.l( l10n + 'modifier' ) }</th><th>${ _.l( l10n + 'check' ) }</th><th>${ _.l( l10n + 'save' ) }</th>
         </thead><tbody>`;
      // Abilities - there may be more then six! (ex: certain v3.0 expansion)
      rule.children.forEach( e => {
         if ( ! subrule.Slot.isPrototypeOf( e ) ) return;
         var attr = e.id, { path, id } = ui._getId( e, container );
         html += `<tr><th><label for="${id}">${ _.l( 'dd5.attribute.' + attr, e.id.toUpperCase() ) }</label></th>
            <td><input type="number" id="${id}" data-attr="${path}" step="1" min="${ e.getMinVal() }" max="${ e.getMaxVal() }" /></td>
            <td data-attr="${attr}"></td>
            <td data-attr="${attr}_mod"  data-format="bonus"></td>
            <td data-attr="${attr}_chk"  data-format="bonus"></td>
            <td data-attr="${attr}_save" data-format="bonus"></td></tr>`;
         list.push( e );
      } );
      // Proficiencies, displayed primary for prototype purpose
      res.entity.get({ type: 'proficiency' }).forEach( ( type ) => {
         var profs = rule.queryChar( 'prof$'+type.id, 'ui' );
         if ( profs ) {
            html += `<tr><td colspan="99"><b>${ type.getName() }</b><br/>`;
            html += _.ary( profs ).map( e =>  e.getName() ).join( _.l( 'glue' ) );
            html += '</td></tr>';
         }
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