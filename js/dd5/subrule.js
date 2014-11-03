'use strict';

_.assert( dd5 && dd5.rule, '[dd5.rule.subrule] 5e rule module must be loaded first.');
_.assert( ! dd5.rule.subrule, '5e subrule module already loaded.' );

(function dd5_subrule_init ( ns ){

var l10n = 'dd5.';
var sys = ns.sys;
var rule = ns.rule;
var subrule = rule.subrule = {};

/**************************** Subrules ***********************************/

subrule.Subrule = _.inherit( rule.Resource, function dd5_rule_Subrule( type, opt, def ) {
   rule.Resource.call( this, type, opt, def );
}, {
   "getSource" : function dd5_Subrule_getSource ( ) {
      return this.rule ? this.rule : this;
   },
   "create" : function dd5_Subrule_create ( ) {
      var result = rule.Resource.prototype.create.call( this );
      result.query = this.query;
      result.getSource = this.getSource;
      return result;
   }
});

subrule.Slot = _.inherit( subrule.Subrule, function dd5_rule_Subrule_Slot ( opt ) {
   if ( ! opt.id ) throw '[dd5.Rule.Subrule] Slot must have id.';
   subrule.Subrule.call( this, 'slot', opt );
   rule._parse_and_delete( this, opt, [ 'options', 'default', 'minVal', 'maxVal', 'can_duplicate' ] );
   _.assert( this.options || ( this.minVal && this.maxVal ), '[dd5.Subrule.Slot] Slot must have options or both minVal and maxVal.' );
},{
   "pick" : null, // Resource.  Selected option.
   "options" : null, // Expression.  Do not call directly; use getOptions instead.
   "default" : null, // Expression.  Default option.
   "minVal" : null, // Expression.  When options is set, this is the minium number of choice, otherwise the min selectable value.
   "maxVal" : null, // Expression.  When options is set, this is the maximum number of choice, otherwise the max selectable value.
   "can_duplicate" : false, // Expression.  True allow user to select duplicate items.

   "toString" : function dd5_Slot_toString ( ) {
      if ( this.options ) {
         return "slot#" + this.id + ':' + this.options;
      } else {
         return "slot#" + this.id + ':' + this.minVal+ '..' + this.maxVal;
      }
   },
   "_createInstance" : function dd5_Slot_createInstance () {
      var result = new subrule.Slot.Instance( this );
      if ( this.default ) result.setPick( this.default.value() );
      return result;
   }
});
subrule.Slot.Instance = _.inherit( sys.Composite, function dd5_rule_Subrule_Slot_Instance ( rule ) {
   sys.Composite.call( this );
   this.id = rule.id;
}, {
   "toString" : function dd5_SlotIns_toString ( ) {
      return this.rule.toString();
   },
   "getOptions" : function dd5_SlotIns_getOptions ( context ) {
      if ( ! this.rule.options ) {
         if ( this.minVal && this.maxVal ) {
            var min = this.minVal.value( context ), max = this.maxVal.value( context ), result = [];
            while ( min <= max ) result.push( min++ );
            return result;
         }
         return [];
      }
      return this.rule.options.value( context );
   },
   "getPick" : function dd5_SlotIns_getPick ( ) { return this.pick; },
   "setPick" : function dd5_SlotIns_pick ( pick ) {
      if ( pick.compile ) pick.compile();
      if ( pick.createInstance ) pick = pick.createInstance();
      this.pick = pick;
   },
   "query" : function dd5_SlotIns_query ( query ) {
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

subrule.Include = _.inherit( subrule.Subrule, function dd5_rule_Subrule_Include ( opt ) {
   subrule.Subrule.call( this, 'include', opt );
   rule._parse_and_delete( this, opt, 'include' );
   _.assert( this.include, '[dd5.Subrule.Include] Include subrule must have include property.' );
   _.assert( ! opt.subrules, '[dd5.Subrule.Include] Include cannot have child subrules.' );
},{
   "includeRule" : null,

   "toString" : function dd5_Include_toString ( ) {
      return "include." + this.include;
   },

   "getInclude" : function dd5_Include_getInclude ( ) {
      if ( this.includeRule ) return this.includeRule;
      var result = this.includeRule = this.include.value();
      if ( result instanceof Array ) result = this.includeRule = result[0];
      if ( ! result ) throw "[dd5.Subrule.Include] Include subject '" + this.include + "' not found.";
      return result;
   },

   "_createInstance" : function dd5_Include_createInstance () {
      var result = subrule.Subrule.prototype._createInstance.call( this );
      result.add( this.getInclude().create() );
      return result;
   }
});

subrule.Adj = _.inherit( subrule.Subrule, function dd5_rule_Subrule_Adj ( opt ) {
   subrule.Subrule.call( this, 'effect', opt );
   rule._parse_and_delete( this, opt, [ 'property', 'value', 'min', 'max' ] );
   _.assert( this.property && this.value, '[dd5.Subrule.Adj] Adj must have property and value.' );
   _.assert( ! opt.subrules, '[dd5.Subrule.Adj] Adj cannot have child subrules.' );
}, {
   "toString" : function dd5_Adj_toString ( ) {
      var src = this.getSource();
      var str = "adj." + src.property;
      if ( src.min ) str += '.min' + src.min;
      if ( src.max ) str += '.max' + src.max;
      return str + ':' + src.value;
   },
   "query" : function dd5_Adj_query ( query ) {
      var src = this.getSource();
      var prop = src.property.value( query );
      if ( prop === query.query ) {
         if ( query.value === undefined ) query.value = new sys.Value();
         var val = src.value.value( query );
         if ( src.min ) val = Math.min( val, src.min.value( query ) );
         if ( src.max ) val = Math.max( val, src.max.value( query ) );
         var source = query._source[0] || this;
         query.value.add( new sys.Bonus( source, val, src.type ) );
      }
   }
});

subrule.Set = _.inherit( subrule.Subrule, function dd5_rule_Subrule_Set ( opt ) {
   subrule.Subrule.call( this, 'effect', opt );
   rule._parse_and_delete( this, opt, [ 'property', 'value', 'min', 'max' ] );
   _.assert( this.property && this.value, '[dd5.Subrule.Set] Set must have property and value.' );
   _.assert( ! opt.subrules, '[dd5.Subrule.Set] Set cannot have child subrules.' );
}, {
   "toString" : function dd5_Set_toString ( ) {
      var src = this.getSource();
      var str = "set." + src.property;
      if ( src.min ) str += '.min' + src.min;
      if ( src.max ) str += '.max' + src.max;
      return str + ':' + src.value;
   },
   "query" : function dd5_Set_query ( query ) {
      var src = this.getSource();
      var prop = src.property.value( query );
      if ( prop === query.query ) {
         if ( query.value === undefined ) query.value = new sys.Value();
         var val = src.value.value( query );
         if ( src.min ) val = Math.min( val, src.min.value( query ) );
         if ( src.max ) val = Math.max( val, src.max.value( query ) );
         var source = query._source[0] || this;
         query.value.add( new sys.Bonus( source, val, src.type ) );
      }
      return query;
   }
});

})( dd5 );