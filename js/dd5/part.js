'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.template, '[dd5.template.part] 5e template module must be loaded first.');
_.assert( ! dd5.template.part, '5e part module already loaded.' );

(function dd5_part_init ( ns ){

var l10n = 'dd5.';
var sys = ns.sys;
var template = ns.template;
var part = template.part = {};

/**************************** Parts ***********************************/

part.Part = template.Resource; // When we need some part methods in the future, we can turn this into a class.

part.Slot = _.inherit( part.Part, function dd5_template_Part_Slot ( opt ) {
   if ( ! opt.id ) throw '[dd5.Template.Part] Slot must have id.';
   part.Part.call( this, 'slot', opt );
   template._parse_and_delete( this, opt, [ 'options', 'default', 'minVal', 'maxVal', 'can_duplicate' ] );
   _.assert( this.options || ( this.minVal && this.maxVal ), '[dd5.Part.Slot] Slot must have options or both minVal and maxVal.' );
},{
   "pick" : null, // Resource.  Selected option.
   "options" : null, // Expression.  Do not call directly; use getOptions instead.
   "default" : null, // Expression.  Default option.
   "minVal" : null, // Expression.  When options is set, this is the minium number of choice, otherwise the min selectable value.
   "maxVal" : null, // Expression.  When options is set, this is the maximum number of choice, otherwise the max selectable value.
   "can_duplicate" : false, // Expression.  True allow user to select duplicate items.
   "copyToParentInstance" : true, // Used by Resource.create.

   "toString" : function dd5_Slot_toString ( ) {
      if ( this.options ) {
         return "slot#" + this.id + ':' + this.options;
      } else {
         return "slot#" + this.id + ':' + this.minVal+ '..' + this.maxVal;
      }
   },
   "_createInstance" : function dd5_Slot_createInstance () {
      var result = new part.Slot.Instance( this );
      if ( this.default ) result.setPick( this.default.value() );
      return result;
   }
});
part.Slot.Instance = _.inherit( sys.Component, function dd5_template_Part_Slot_Instance ( template ) {
   sys.Component.call( this, template );
   this.id = template.id;
}, {
   "toString" : function dd5_SlotIns_toString ( ) {
      return this.res_template.toString();
   },
   "getOptions" : function dd5_SlotIns_getOptions ( context ) {
      if ( ! this.res_template.options ) {
         if ( this.minVal && this.maxVal ) {
            var min = this.minVal.value( context ), max = this.maxVal.value( context ), result = [];
            while ( min <= max ) result.push( min++ );
            return result;
         }
         return [];
      }
      return this.res_template.options.value( context );
   },
   "getPick" : function dd5_SlotIns_getPick ( ) { return this.pick; },
   "setPick" : function dd5_SlotIns_pick ( pick ) {
      if ( pick.compile ) pick.compile();
      if ( pick.createInstance ) pick = pick.createInstance();
      this.pick = pick;
   },
   "_query" : function dd5_SlotIns_query ( query ) {
      if ( this.pick ) {
         if ( query.query === this.id && query.value === undefined ) {
            if ( typeof( this.pick ) === 'number' ) {
               query.value = new sys.Value( new sys.Bonus( this, this.pick ) );
            } else {
               query.value = this.pick;
            }
         } else if ( this.pick._query ) {
            this.pick._query( query );
         }
      }
   }
});

part.Include = _.inherit( part.Part, function dd5_template_Part_Include ( opt ) {
   part.Part.call( this, 'include', opt );
   template._parse_and_delete( this, opt, 'include' );
   _.assert( this.include, '[dd5.Part.Include] Include part must have include property.' );
   _.assert( ! opt.parts, '[dd5.Part.Include] Include cannot have child parts.' );
},{
   "includeTemplate" : null,
   "copyToParentInstance" : true, // Used by Resource.create.

   "toString" : function dd5_Include_toString ( ) {
      return "include." + this.include;
   },

   "getInclude" : function dd5_Include_getInclude ( ) {
      if ( this.includeTemplate ) return this.includeTemplate;
      var result = this.includeTemplate = this.include.value();
      if ( result instanceof Array ) result = this.includeTemplate = result[0];
      if ( ! result ) throw "[dd5.Part.Include] Include subject '" + this.include + "' not found.";
      return result;
   },

   "_query" : function dd5_Adj_query ( query ) {
      // If a query is originated in an instance, the included resource will receive query as a child.
      // But if the query originates in template, it is not a child and we need to manually forward the query.
      if ( query.template ) this.getInclude()._query( query );
      // Query children.  Should do nothing, but better safe.
      part.Part.prototype._query.call( this, query );
   },

   "_createInstance" : function dd5_Include_createInstance () {
      var result = part.Part.prototype._createInstance.call( this );
      result.add( this.getInclude().create() );
      return result;
   }
});

part.Adj = _.inherit( part.Part, function dd5_template_Part_Adj ( opt ) {
   part.Part.call( this, 'effect', opt );
   template._parse_and_delete( this, opt, [ 'property', 'value', 'min', 'max' ] );
   _.assert( this.property && this.value, '[dd5.Part.Adj] Adj must have property and value.' );
   _.assert( ! opt.parts, '[dd5.Part.Adj] Adj cannot have child parts.' );
}, {
   "toString" : function dd5_Adj_toString ( ) {
      var str = "adj." + this.property;
      if ( this.min ) str += '.min' + this.min;
      if ( this.max ) str += '.max' + this.max;
      return str + ':' + this.value;
   },
   "_query" : function dd5_Adj_query ( query ) {
      var prop = this.property.value( query );
      if ( prop === query.query ) {
         if ( query.value === undefined ) query.value = new sys.Value();
         var val = this.value.value( query );
         if ( this.min ) val = Math.min( val, this.min.value( query ) );
         if ( this.max ) val = Math.max( val, this.max.value( query ) );
         var source = query._source[0] || this;
         query.value.add( new sys.Bonus( source, val, this.type ) );
      }
   }
});

part.Set = _.inherit( part.Part, function dd5_template_Part_Set ( opt ) {
   part.Part.call( this, 'effect', opt );
   template._parse_and_delete( this, opt, [ 'property', 'value', 'min', 'max' ] );
   _.assert( this.property && this.value, '[dd5.Part.Set] Set must have property and value.' );
   _.assert( ! opt.parts, '[dd5.Part.Set] Set cannot have child parts.' );
}, {
   "toString" : function dd5_Set_toString ( ) {
      var str = "set." + this.property;
      if ( this.min ) str += '.min' + this.min;
      if ( this.max ) str += '.max' + this.max;
      return str + ':' + this.value;
   },
   "_query" : function dd5_Set_query ( query ) {
      var prop = this.property.value( query );
      if ( prop === query.query ) {
         if ( query.value === undefined ) query.value = new sys.Value();
         var val = this.value.value( query );
         if ( this.min ) val = Math.min( val, this.min.value( query ) );
         if ( this.max ) val = Math.max( val, this.max.value( query ) );
         var source = query._source[0] || this;
         query.value.add( new sys.Bonus( source, val, this.type ) );
      }
      return query;
   }
});

})( dd5 );