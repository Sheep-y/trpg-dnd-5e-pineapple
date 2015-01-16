var dd5; // Globals
if ( ! dd5 || ! dd5.rule ) throw new Error( '[dd5.subrule] 5e rule module must be loaded first.' );
else if ( ! dd5.rule.subrule ) ( function dd5_subrule_init ( ns ) { 'use strict';

var sys = ns.sys;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule = Object.create( null );

/**************************** Subrules ***********************************/

var base = subrule.Subrule = {
   '__proto__' : rule.Rule,
   'create' ( opt ) {
      var that = _.newIfSame( this, base );
      rule.Rule.create.call( this, opt );
      return that;
   },
};

subrule.Slot = {
   '__proto__' : base,
   'create' ( opt ) {
      var that = _.newIfSame( this, subrule.Slot );
      base.create.call( that, opt );
      _.assert( opt.id, '[dd5.rule.Slot] Slot must have id.' );
      _.assert( that.options || ( that.minVal && that.maxVal ), '[dd5.rule.Slot] Slot must have options or both minVal and maxVal.' );
      return that;
   },
   'cid': 'subrule.slot',
   'options' : null, // Option list.
   'count'   : 1,    // How many picks.
   'default' : null, // Expression.  Default option.
   'minVal'  : null, // Expression.  When options is set, this is the minium number of choice, otherwise the min selectable value.
   'maxVal'  : null, // Expression.  When options is set, this is the maximum number of choice, otherwise the max selectable value.
   'can_duplicate' : ()=>false, // Expression.  True allow user to select duplicate items.
   'compile_list' : [ 'options', 'default', 'minVal', 'maxVal', 'can_duplicate' ],

   'toString' ( ) {
      if ( this.options ) {
         return "slot#" + this.id + ':' + this.options;
      } else {
         return "slot#" + this.id + ':' + this.minVal + '..' + this.maxVal;
      }
   },
   'build' ( ) {
      var result = base.build.call( this );
      if ( this.default ) result.setPick( this.default() );
      return result;
   },

   'pick' : null, // Selected option.
   'getOptions' ( query ) {
      var result = [];
      if ( ! this.options ) {
         if ( this.minVal && this.maxVal ) {
            var min = this.queryChar( 'slotMin', this, this.minVal(), query );
            var max = this.queryChar( 'slotMax', this, this.maxVal(), query );
            while ( min <= max ) result.push( min++ );
         }
      } else {
         result = this.queryChar( 'slotOptions', this, this.options(), query );
      }
      return result;
   },
   'getPick' ( ) { return this.pick; },
   'setPick' ( pick ) {
      if ( pick !== null && this.getOptions().indexOf( pick ) < 0 ) {
         return log.warn( `[dd5.rule.Slot] Invalid picked option for slot ${ this.id }: ${ pick }` );
         if ( this.getPick() === null ) return;
         pick = null;
      }
      if ( pick && pick.build ) pick = pick.build();
      this.fireAttributeChanged( this.id, pick, this.pick );
      if ( this.pick && _.is.object( this.pick ) ) this.remove( this.pick );
      this.pick = pick;
      if ( pick  && _.is.object( pick ) ) this.add( pick );
   },
   'query' ( query ) {
      var pick = this.getPick();
      if ( this.pick ) {
         if ( query.query === this.id && query.value === undefined ) {
            if ( typeof( pick ) === 'number' ) {
               query.value = sys.Value.create( sys.Bonus.create( pick, this ) );
            } else {
               query.value = this.pick;
            }
         } else if ( pick.query ) {
            this.pick.query( query );
         }
      }
   },
};

subrule.Include = {
   '__proto__' : base,
   'create' ( opt ) {
      var that = _.newIfSame( this, subrule.Include );
      base.create.call( that, opt );
      _.assert( that.include, '[dd5.rule.Include] Include subrule must have include property.' );
      _.assert( ! opt.subrules, '[dd5.rule.Include] Include cannot have child subrules.' );
      return that;
   },
   'cid' : 'subrule.include',
   'include' : null, // A function returning a resource or an array of resource
   'compile_list' : [ 'include' ],

   'build' ( ) {
      this.add( this.include.build() );
   },

   'getInclude' ( ) {
      return _.ary( this.include() );
   },

   'build' ( ) {
      var result = base.build.call( this );
      for ( var i of this.getInclude() ) result.add( i.build() );
      return result;
   }
};

subrule.Adj = {
   '__proto__' : base,
   'create' ( opt ) {
      var that = _.newIfSame( this, subrule.Adj );
      base.create.call( that, opt );
      _.assert( that.property && that.value, '[dd5.rule.Adj] Adj must have property and value.' );
      return that;
   },
   'cid' : 'subrule.adjust',
   'compile_list' : [ 'property', 'value', 'min', 'max' ],
   'toString' ( ) {
      var str = "adj." + this.property();
      if ( this.min ) str += '.min' + this.min();
      if ( this.max ) str += '.max' + this.max();
      return str + ':' + this.value();
   },
   'query' ( query ) {
      var prop = this.property( query );
      if ( prop === query.query ) {
         if ( query.value === undefined ) query.value = sys.Value.create();
         var val = parseFloat( this.value( query ) );
         if ( this.min ) val = Math.min( val, this.min( query ) );
         if ( this.max ) val = Math.max( val, this.max( query ) );
         var source = this.getResource() || this;
         query.value.add( sys.Bonus.create( val, source, _.call( this.type, query ) ) );
      }
   }
};

pinbun.event.load( 'dd5.rule.subrule' );

})( dd5 );