'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.template && dd5.template.part, '[dd5.effect] 5e part template module must be loaded first.' );
_.assert( ! dd5.template.effect, '5e effect module already loaded.' );

(function dd5_effect_init ( ns ){

var l10n = 'dd5.';
var sys = ns.sys;
var effect = ns.template.effect = {};

/*

effect.DarkVision = _.inherit( sys.Component, function dd5_Effect_DarkVision ( range ) {
   sys.Component.call( this, 'effect.darkvision', 'DarkVision' );
   this.range = range;
}, {
   effect : function dd5_Effect_DarkVision_effect( q ) {
      if ( ! q.value || q.value < this.range ) q.value = this.range;
   }
});

*/

})( dd5 );