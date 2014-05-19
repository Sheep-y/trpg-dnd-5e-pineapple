'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5, '[dd5.res] 5e core module must be loaded first.');
_.assert( ! dd5.res, '5e resource module already loaded.' );

(function dd5_resource_init ( ns ){

var l10n = 'dd5.';
var sys = ns.sys;

var Catalog = _.inherit( null, function dd5__Catalog () {
   this._list = [];
}, {
   _list : null,
   add : function dd5__Catalog_add ( item ) { this._list.push( item ); },
   remove : function dd5__Catalog_remove ( item ) { this._list.splice( this._list.indexOf( item ), 1 ); },
   // find( { 'level': { '>=': 4, '<=': 6 },
   //         'freq' : [ 'daily', 'at-will' ] } )
   get : function dd5__Catalog_find ( criteria ) {
      // We can do optimisation later
      if ( typeof( criteria ) === 'string' ) criteria = { 'id' : criteria };
      var result = this._list.concat();
      if ( criteria ) {
         for ( var i in criteria ) {
            var criteron = criteria[i], filter;
            if ( criteron instanceof Array ) {
               // List match
               filter = function dd5_Catalog_find_list( e ) { return criteron.indexOf(　e[i] ) >= 0; };
            } else if ( typeof( criteron ) === 'object' ) {
               // Range match
               var lo = criteron['>='], hi = criteron['<='];
               filter = function dd5_Catalog_find_range( e ) {
                  var val = +e[i];
                  if ( isNaN( val ) ) return false;
                  if ( lo !== undefined && val < lo ) return false;
                  if ( hi !== undefined && val > hi ) return false;
                  return true;
               };
            } else {
               // Plain value match
               criteron += "";
               filter = function dd5_Catalog_find_text( e ) { return criteron === ""+e[i]; };
            }
            result = result.filter( filter );
            if ( result.length <= 0 ) break;
         }
      }
      return result;
   }
} );

/** In-system Resources */
var res = ns.res = {
   "sourcebook": new Catalog(),
   "entity"    : new Catalog(),
   "character" : new Catalog(),
   "feature"   : new Catalog(),

   "race"      : new Catalog(),
   "skill"     : new Catalog(),
   "background": new Catalog(),
   "class"     : new Catalog(),
   "equipment" : new Catalog(),
   "feat"      : new Catalog(),
   "spell_list": new Catalog(),
   "spell"     : new Catalog()
};

/** Resource Templates */
var template = ns.template = {};

template._opt_delete = function dd5_Template_opt_delete ( opt, field ) {
   field = _.ary( field );
   for ( var a in opt ) {
      if ( field.indexOf( a ) >= 0 ) delete opt[ a ];
   }
};

template._parse_and_delete = function dd5_Template_parse_and_delete ( that, opt, field ) {
   field = _.ary( field );
   try {
      for ( var f in field ) {
         f = field[ f ];
         if ( opt[ f ] !== undefined ) {
            that[ f ] = new template.expression.create( opt[ f ] );
            delete opt[f];
         }
      }
   } catch ( ex ) {
      throw 'Error parsing "' + opt[field] + '" as ' + field + ':\n' + ex;
   }
};

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

template.Resource = _.inherit( sys.Composite, function dd5_template_Resource ( type, opt, def ) {
   if ( opt ) {
      sys.Composite.call( this, opt.id );
      if ( opt.sourcebook ) {
         if ( typeof( opt.sourcebook ) === 'string' ) opt.sourcebook = res.sourcebook.get({ id: opt.sourcebook })[0];
         this.sourcebook = opt.sourcebook;
      }
      template._opt_delete( opt, [ 'id', 'sourcebook' ] );
   } else {
      sys.Composite.call( this );
   }
   this.res_type = type;
   if ( opt ) for ( var attr in opt ) if ( this[attr] === undefined ) this[attr] = opt[attr];
   if ( def ) for ( var attr in def ) if ( this[attr] === undefined ) this[attr] = def[attr];
}, {
   "res_type"  : undefined,
   "sourcebook": undefined,

   "_createInstance" : function dd5_Resource_createInstance ( ) {
      return new sys.Component( this );
   },
   "create" : function dd5_Resource_create ( ) {
      var result = this._createInstance( this );
      this.getChildren().forEach( function dd5_Resource_createInstance_copyslot ( e ) {
         if ( e.copyToParentInstance ) result.add( e.create() );
      } );
      return result;
   }
});

template.LazyResource = _.inherit( template.Resource, function dd5_template_LazyResource ( type, opt, def ) {
   template.Resource.call( this, type, opt, def );
}, {
   "parts" : undefined,
   "compile" : _.dummy, // Set by loader depending on data type
   "_createInstance" : function dd5_LazyResource_createInstance ( ) {
      this.compile();
      return template.Resource.prototype._createInstance.call( this );
   }
});

template.SourceBook = _.inherit( template.Resource, function dd5_template_Book ( opt ) {
   template.Resource.call( this, 'sourcebook', opt );
   this.l10n = 'sourcebook.' + this.id;
   check_dup( this );
   template._opt_delete( opt, [ 'name', 'publisher', 'category', 'type', 'url', 'autoload' ] );
});

template.Entity = _.inherit( template.Resource, function dd5_Entity ( opt ) {
   template.Resource.call( this, 'entity', opt );
   this.l10n = 'entity.' + this.id;
   check_dup( this );
   // With entity, assume all properties are valid. This will also delete parts, but an Entity shouldn't need it!
   for ( var a in opt ) delete opt[a];
});

template.Character = _.inherit( template.LazyResource, function dd5_template_Character ( opt ) {
   template.LazyResource.call( this, 'character', opt );
   this.l10n = 'character.' + this.id;
   check_dup( this );
   template._opt_delete( opt, [ 'type' ] );
}, {
   "type" : undefined, // 'system', 'pc', 'npc', 'mob'
   "visible" : true,

   "_createInstance" : function dd5_Character_createInstance ( ) {
      this.compile();
      return new sys.Character( this );
   }
});

template.Feature = _.inherit( template.LazyResource, function dd5_template_Feature ( opt, parent, element ) {
   template.LazyResource.call( this, 'feature', opt, null, element );
   this.parent = parent;
   this.l10n = ( parent ? parent.l10n : 'feature' ) + '.' + this.id;
   check_dup( this, { path: this.l10n }, this.l10n );
});

template.Race = _.inherit( template.LazyResource, function dd5_template_Race ( opt ) {
   template.LazyResource.call( this, 'race', opt, { 'rarity': 'common', 'size': 0 } );
   this.l10n = 'race.' + this.id;
   check_dup( this );
   template._opt_delete( opt, [ 'rarity' ] );
});

})( dd5 );