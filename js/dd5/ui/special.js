var dd5; // Globals
if ( ! dd5 || ! dd5.ui ) throw Error( '[dd5] dd5 UI module must be loaded first.' );
else if ( ! dd5.ui.registered( 'edit', 'dd5.feature.pc_ability' ) ) ( function dd5_ui_special_init ( ns ) { 'use strict';

var ui = ns.ui;
var res = ns.res;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule;

ui.registerFactory( 'feature.pc_ability', {
   'edit' ( rule, container ) {
      var list = [];
      var l10n = 'dd5.feature.pc_ability.', glue = _.l( 'glue' );

      // Ability table captions
      var html = `<div class="dd5 pc_ability full_width"><table class="full_width"><caption>${ _.l( l10n + 'caption' ) }</caption><thead>
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
      html += `<tr><td colspan='99' align='center'>${ _.l( 'dd5.feature.pc_ability.point_buy' ) } <span data-attr="point_cost"></span></td></tr>`;
      html += `<tr><td colspan='99'>${ _.l( 'dd5.attribute.ac' ) } <span data-attr="ac"></span></td></tr>`;
      html += `<tr><td colspan='99'><b>${ _.l( 'dd5.attribute.proficiency' ) }</b><br/>`;
      // Proficiencies, displayed primary for prototype purpose
      html += _.flatten( res.entity.get({ type: 'proficiency' }).map( ( type ) => {
         return _.array( rule.queryChar( 'prof$'+type.id, 'ui' ) ).map( e => e.getName() ).join( glue );
      } ) ).filter( e => e ).join( '<br/>' );
      html += '</td></tr>';

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