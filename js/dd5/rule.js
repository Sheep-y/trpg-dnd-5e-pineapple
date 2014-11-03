'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

(function dd5_rule_init ( ns ){

var err_rule = '[dd5.rule] ';
_.assert( dd5, err_rule + '5e core module must be loaded first.');
_.assert( ! dd5.rule, err_rule + '5e rule module already loaded.' );

var sys = ns.sys;
var res = ns.res;

/** Rules */
var rule = ns.rule = {};

rule._opt_delete = function dd5_rule_opt_delete ( opt, field ) {
   field = _.ary( field );
   for ( var a in opt ) {
      if ( field.indexOf( a ) >= 0 ) delete opt[ a ];
   }
};

rule._parse_and_delete = function dd5_rule_parse_and_delete ( that, opt, field ) {
   var expression = ns.loader.expression; // ns.loader may not exist when we declare this function
   _.ary( field ).forEach( function dd5_rule_parse_and_delete_each ( f ) {
      try {
         if ( opt[ f ] !== undefined ) {
            that[ f ] = expression.create( opt[ f ] );
            delete opt[f];
         }
      } catch ( ex ) {
         throw 'Error parsing "' + opt[f] + '" as ' + f + ':\n' + ex;
      }
   } );
};

/** Internal function used to check for duplication */
function check_dup ( that, criteria, id ) {
   if ( ! id ) criteria = id = that.id;
   if ( ! id ) throw "id is required.";
   if ( typeof( criteria ) === 'string' ) criteria = { id: criteria };
   var sourcebook = that.sourcebook;
   sourcebook = sourcebook ? ' with ' + sourcebook.id : '';
   var dup = res[that.res_type].get( criteria );
   if ( dup.length > 1 ) {
      throw 'Redeclaring ' + that.l10n + sourcebook + '. First declared in ' + dup[0].sourcebook.id;
   } else {
      _.info( '[dd5] Created ' + that.l10n + sourcebook );
   }
}

/*****************************************************************************/

rule.Resource = _.inherit( sys.Composite, function dd5_rule_Resource ( type, opt, def ) {
   if ( opt ) {
      sys.Composite.call( this, opt.id );
      if ( opt.sourcebook ) {
         if ( typeof( opt.sourcebook ) === 'string' ) opt.sourcebook = res.sourcebook.get({ id: opt.sourcebook })[0];
         this.sourcebook = opt.sourcebook;
      }
      rule._opt_delete( opt, [ 'id', 'sourcebook' ] );
   } else {
      sys.Composite.call();
   }
   this.res_type = type;
   if ( opt ) for ( var attr in opt ) if ( this[attr] === undefined ) this[attr] = opt[attr];
   if ( def ) for ( var attr in def ) if ( this[attr] === undefined ) this[attr] = def[attr];
}, {
   "res_type"  : undefined,
   "sourcebook": undefined,

   "_createInstance" : function dd5_Resource_createInstance ( ) {
      return new sys.Component( this.id, this );
   },
   "create" : function dd5_Resource_create ( ) {
      var result = this._createInstance( this );
      this.getChildren().forEach( function dd5_Resource_createInstance_copyslot ( e ) {
         result.add( e.create() );
      } );
      return result;
   }
});

rule.LazyResource = _.inherit( rule.Resource, function dd5_rule_LazyResource ( type, opt, def ) {
   rule.Resource.call( this, type, opt, def );
}, {
   "subrules" : undefined,
   "compile" : _.dummy, // Set by loader depending on data type
   "_createInstance" : function dd5_LazyResource_createInstance ( ) {
      this.compile();
      return rule.Resource.prototype._createInstance.call( this );
   }
});

rule.SourceBook = _.inherit( rule.Resource, function dd5_rule_Book ( opt ) {
   rule.Resource.call( this, 'sourcebook', opt );
   this.l10n = 'sourcebook.' + this.id;
   check_dup( this );
   rule._opt_delete( opt, [ 'name', 'publisher', 'category', 'type', 'url', 'autoload' ] );
});

rule.Entity = _.inherit( rule.Resource, function dd5_Entity ( opt ) {
   rule.Resource.call( this, 'entity', opt );
   this.l10n = 'entity.' + this.id;
   check_dup( this );
   // With entity, assume all properties are valid. This will also delete subrules, but an Entity shouldn't need it!
   for ( var a in opt ) delete opt[a];
});

rule.Character = _.inherit( rule.LazyResource, function dd5_rule_Character ( opt ) {
   rule.LazyResource.call( this, 'character', opt );
   this.l10n = 'character.' + this.id;
   check_dup( this );
   rule._opt_delete( opt, [ 'type' ] );
}, {
   "type" : undefined, // 'system', 'pc', 'npc', 'mob'
   "visible" : true,

   "_createInstance" : function dd5_Character_createInstance ( ) {
      this.compile();
      return new sys.Character( this );
   }
});

rule.Feature = _.inherit( rule.LazyResource, function dd5_rule_Feature ( opt, parent, element ) {
   rule.LazyResource.call( this, 'feature', opt, null, element );
   this.parent = parent;
   this.l10n = ( parent ? parent.l10n : 'feature' ) + '.' + this.id;
   check_dup( this, { path: this.l10n }, this.l10n );
});

rule.Race = _.inherit( rule.LazyResource, function dd5_rule_Race ( opt ) {
   rule.LazyResource.call( this, 'race', opt, { 'rarity': 'common', 'size': 0 } );
   this.l10n = 'race.' + this.id;
   check_dup( this );
   rule._opt_delete( opt, [ 'rarity' ] );
});

})( dd5 );