'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5e, '5th edition core module must be loaded first.');

(function( ns ){

var sys = ns.Sys;
//var res = ns.Res;
//var base = ns.Base;

var l10n = 'dd5e.';

// Set default system.
var res = ns.Res = {
   "source": new _.Index([ 'id', 'publisher', 'category', 'type' ]),
   "entity": new _.Index([ 'id', 'source', 'type' ]), // For stuffs like languages, alignments, genders, sizes, etc.
   "character": new _.Index([ 'id', 'source' ]),
   "feature": new _.Index([ 'id', 'uid', 'source' ]),

   "race": new _.Index([ 'id', 'source', 'rarity' /* Normal, Uncommon */ ]),
   "skill": new _.Index([ 'id', 'source' ]),
   "background": new _.Index([ 'id', 'source' ]),
   "class": new _.Index([ 'id', 'source' ]),
   "equipment": new _.Index([ 'id', 'type', 'source' ]),
   "feat": new _.Index([ 'id', 'source' ]),
   "spell_list": new _.Index([ 'id', 'source', 'class', 'level' ]),
   "spell": new _.Index([ 'id', 'school', 'level' ]),
};

var base = ns.Base = {};
        
base.Resource = _.inherit( sys.Component, function dd5e_Base( type, opt, attributes ) {
   var thisp = this;
   sys.Component.call( this, opt.id );
   if ( opt.source ) {
      if ( typeof( opt.source ) === 'string' ) this.source = res.source.get({ id: opt.source })[0];
      else this.source = opt.source;
   };
   if ( attributes ) attributes.forEach( function( attr ){ if ( opt[attr] ) thisp[attr] = opt[attr]; } );
   res[type].add( this );
}, {
   getDesc : function dd5e_Resource_getDesc ( ) {
      return '<li>' + this._childDesc().join('</li><li>') + '</li>';
   },
   _childDesc : function dd5e_Resource_childDesc ( ) {
      return this.children.map( function dd5e_Resource_getDesc_each(e){ return e.getDesc(); } );
   },
});

base.Source = _.inherit( base.Resource, function dd5e_Base_Source( opt ) {
   this.publisher = 'Wizards of the Coast';
   this.category = 'Rulebook'; // 'Magazine', 'Module'
   base.Resource.call( this, 'source', opt, [ 'name', 'publisher', 'category', 'type', 'url' ] );
   this.l10n = 'source.' + this.id;
});

base.Entity = _.inherit( base.Resource, function dd5e_Base_Entity( opt ) {
   base.Resource.call( this, 'entity', opt, Object.keys( opt ) );
   this.l10n = 'entity.' + this.id;
});

base.Feature = _.inherit( sys.Component, function dd5e_base( id, parent ) {
   sys.Component.call( this, id );
   this.l10n = ( parent ? parent.l10n : 'feature' ) + '.' + id;
});

base.Race = _.inherit( base.Resource, function dd5e_Base_Race( opt ) {
   this.rarity = 'common';
   this.l10n = 'race.' + opt.id;
   base.Resource.call( this, 'race', opt );
});

/*************************************************************************/

var effect = ns.Effect = {};

effect.Choice = _.inherit( sys.Component, function dd5e_Effect_DarkVision( opt ) {
   sys.Component.call( this, 'effect.choice', 'Choice' );
   this.options = _.toAry( opt );
   if ( opt.length === 1 ) this.selection = opt[0];
}, {
   selection: null,
   options: null,
   effect : function dd5e_Effect_Choice_effect( q ) {
      if ( this.selection ) this.selection.effect( q );
   }
});


effect.DarkVision = _.inherit( sys.Component, function dd5e_Effect_DarkVision( range ) {
   sys.Component.call( this, 'effect.darkvision', 'DarkVision' );
   this.range = range;
}, {
   effect : function dd5e_Effect_DarkVision_effect( q ) {
      if ( ! q.value || q.value < this.range ) q.value = this.range;
   }
});

effect.Modifier = _.inherit( sys.Component, function dd5e_Effect_Modifier( property, mod ) {
   sys.Component.call( this, 'effect.modifier', property );
   this.modifying = property; 
   this.modfier = mod;
}, {
   effect : function dd5e_Effect_Modifier_effect( q ) {
      //if ( this.selection ) this.selection.effect( q );
      //else if ( ! this.options && q.type === this.modifying ) {
         if ( q.value instanceof sys.Value )
            q.value.add( new sys.Bonus( this, this.modifier ) ); // TODO: Find nearest source as parent!
         else
            q.value += this.modifier;
      //}
   }
});

effect.Prof = _.inherit( sys.Component, function dd5e_Effect_Prof( type, property ) {
   var prof = _.toAry( property );
   var keys = prof.map( function(p) { return p + ' Prof'; } ).concat( [ type + ' Prof' ] );
   sys.Component.call( this, 'effect.proficiency', keys );
   this.type = type;
   this.typekey = type + ' Prof';
   this.prof = prof;
}, {
   effect : function dd5e_Effect_Modifier_effect( q ) {
      if ( q === this.typekey ) {
         var val = q.value;
         _.assert( val instanceof Array );
         this.prof.forEach( function(p) { if ( val.indexOf( p ) < 0 ) val.push( p ); } );
      } else {
         q.value = true;
      }
   }
});

/*
new base.Source( { id: 'PHB' } );

new base.Race( { 
   id: 'Dwarf',
   speed: 25, 
   source: 'PHB',
   features: {
      0: [
         new effect.DarkVision( 60 ),
         new effect.Modifier( "Con", 2 ),
         new effect.Prof( 'Weapon', [ 'Battleaxe', 'Handaxe', 'Throwing Hammer', 'Warhammer' ] ),
         new effect.Prof( 'Language', [ 'Common', 'Dwarvish' ] ),
         new base.Feature( 'race.dwarf.dwarven_resilience' ), // "You have advantage on saving throws against poison, and you have resistance against poison damage."
         new base.Feature( 'race.dwarf.stonecunning' ), // You have advantage on any Intelligence (History) check related to the origin of particular stonework. Additionally, when exploring underground environments, you cannot become lost.
         new base.Choice( 'subrace', [
            new base.Feature( 'Hill' ),
            new base.Feature( 'Mountain' )
         ] )
      ]
   }
} );
*/

})( dd5e );