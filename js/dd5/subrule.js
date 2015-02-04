var dd5; // Globals
if ( ! dd5 || ! dd5.rule ) throw new Error( '[dd5.subrule] 5e rule module must be loaded first.' );
else if ( ! dd5.rule.subrule ) ( function dd5_subrule_init ( ns ) { 'use strict';

var sys = ns.sys;
var log = ns.event;
var rule = ns.rule;
var subrule = rule.subrule = _.map();

/**************************** Subrules ***********************************/

var base = subrule.Subrule = {
   '__proto__' : rule.Rule,
   'create' ( opt ) {
      var me = _.newIfSame( this, base );
      rule.Rule.create.call( this, opt );
      return me;
   },
   'query_hook' ( ) { return []; },
};

function setProficiency ( rule, query, prof_type, prof ) {
   if ( ! prof || ( Array.isArray( prof ) && ! prof.length ) ) return;
   if ( query.query.startsWith( prof_type ) ) {
      var prof_ary = _.ary( prof );
      if ( query.query === prof_type ) {
         query.add_prof( prof_ary );
      } else {
         var prof_id = prof_ary.map( v => v.id );
         if ( ! query.value && prof_id.indexOf( query.substr( prof_type.length + 1 ) ) >= 0 ) {
            query.value = rule;
         }
      }
      return query;
   }
   if ( query.query === rule.id || query.query === rule.getPath() ) {
      return query.add_result( prof );
   }
   return base.query.call( rule, query );
}

subrule.Include = {
   '__proto__' : base,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.Include );
      base.create.call( me, opt );
      _.assert( me.include, '[dd5.rule.Include] Include must have include property.' );
      _.assert( ! opt.subrules, '[dd5.rule.Include] Include cannot have child subrules.' );
      return me;
   },
   'cid' : 'subrule.include',
   'include' : null, // A function returning a resource or an array of resource
   'compile_list' : [ 'include' ],

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
      var me = _.newIfSame( this, subrule.Adj );
      base.create.call( me, opt );
      _.assert( me.property && me.value, '[dd5.rule.Adj] Adj must have property and value.' );
      return me;
   },
   'cid' : 'subrule.adjust',
   'compile_list' : [ 'property', 'value', 'min', 'max' ],
   'toString' ( ) {
      return "Adj." + this.property();
   },
   'query' ( query ) {
      var prop = _.array( this.property( query ) );
      if ( prop.includes( query.query ) || query.query === this.getPath() ) {
         var val = parseFloat( this.value( query ) );
         if ( this.min ) val = Math.min( val, this.min( query ) );
         if ( this.max ) val = Math.max( val, this.max( query ) );
         return query.add_bonus( val, this.getResource() || this, _.call( this.type || null, query ) );
      }
      return base.query.call( this, query );
   },
   'query_hook' ( ) { return _.array( this.property() ); },
};

subrule.Prof = {
   '__proto__' : base,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.Prof );
      base.create.call( me, opt );
      _.assert( me.prof_type, me.value, '[dd5.rule.Prof] Prof must have prof_type and value.' );
      return me;
   },
   'cid' : 'subrule.prof',

   'getLabel' ( ) {
      return _.l( 'dd5.attribute.' + this.prof_type );
   },

   'value' : null,

   'copy_list' : [ 'prof_type' ],
   'compile_list' : [ 'value', 'type' ],

   'toString' ( ) {
      return "Prof: " + this.value();
   },

   'getValue' ( ) { return this.value(); },
   'query' ( query ) {
      return setProficiency( this, query, this.prof_type, this.getValue() );
   },
   'query_hook' ( ) { return [ this.prof_type ]; },
};

subrule.Slot = {
   '__proto__' : base,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.Slot );
      base.create.call( me, opt );
      // Please also update subrule.Number, since subrule.Number is bypassing this constructor because of the assertion
      _.assert( opt.id && me.options, '[dd5.rule.Slot] Slot must have id and options set.' );
      return me;
   },
   'cid': 'subrule.slot',
   'options' : null, // Option list.
   'count'   : null, // How many picks.  null means always single choice, otherwise may be multiple.
   'default' : null, // Default option.
   'can_duplicate' : ()=>false, // True allow user to select duplicate items.
   'compile_list' : [ 'options', 'count', 'default', 'can_duplicate' ],

   'toString' ( ) {
      return "Slot#" + this.id;
   },
   'build' ( ) {
      var result = base.build.call( this );
      if ( this.default ) result.setPick( this.default() );
      return result;
   },

   'pick' : null, // Selected option.
   'getCompatibleOptions' ( context ) {
      return this.queryChar( 'slotOptions', this, this.options( context ), context );
   },
   'getOptions' ( context ) {
      return this.getCompatibleOptions( context ).map( e => sys.Option.create( e ) );
   },
   'getPick' ( ) { return this.pick; },
   'setPick' ( index, pick ) {
      var orig = this.getPick(), result = null;
      var remover = ( e ) => {
         if ( e && rule.Rule.isPrototypeOf( e ) ) this.remove( e );
      };
      var adder = ( e ) => {
         if ( ! this.validPick( e ) ) {
            log.warn( `[dd5.rule.Slot] Invalid picked option for slot ${ this.id }: ${ e }` );
            return null;
         } else if ( _.is.object( e ) ) {
            if ( e.build ) e = e.build();
            if ( rule.Rule.isPrototypeOf( e ) ) this.add( e );
         }
         return e;
      };

      if ( this.count !== null ) { // Multiple choice slot
         if ( arguments.length <= 1 ) {
            // Mass replace multiple picks
            pick = _.coalesce( _.ary( index ), null );
            if ( orig ) _.ary( orig ).forEach( remover );
            if ( pick !== null ) result = _.ary( pick ).map( builder );
         } else {
            // Replace individual pick
            index = ~~index;
            var count = this.count();
            if ( index < 0 || index >= count )
               return log.warn( `[dd5.rule.Slot] Invalid picked index ${ index } for slot ${ this.id }: ${ pick }` );
            if ( orig && orig.length > index ) remover( orig[ index ] );
            result = _.ary( orig );
            if ( ! result ) result = new Array( count ).fill( null );
            result[ index ] = adder( pick );
         }
      } else { // Single choice slot
         if ( arguments.length >= 2 && index !== 0 )
            return log.warn( `[dd5.rule.Slot] Invalid picked index ${ index } for slot ${ this.id }: ${ pick }` );
         else if ( arguments.length === 1 )
            pick = index;
         remover( orig );
         result = adder( pick );
      }

      // Update and fire event.
      this.pick = result;
      this.fireAttributeChanged( this.id, result, orig );
   },
   'validPick' ( pick ) {
      return pick == null || this.getCompatibleOptions().includes( pick );
   },
   'query' ( query ) {
      if ( query.query === this.id || query.query === this.getPath() ) {
         return query.add_result( this.getPick() );
      }
      return base.query.call( this, query );
   },
   'query_hook' ( ) { return [ this.id ]; },
};

subrule.NumSlot = {
   '__proto__' : subrule.Slot,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.NumSlot );
      // Bypassing Slot's constructor assertion, because option may not be available
      Object.getPrototypeOf( subrule.Slot ).create.call( me, opt );
      _.assert( me.id && ( me.min_val || me.max_val ), '[dd5.rule.NumSlot] NumSlot must have id and min or max.' );
      _.assert( me.count === null, '[dd5.rule.NumSlot] NumSlot does not support multiple choice.' )
      return me;
   },
   'cid': 'subrule.numslot',
   'min_val'  : null,
   'max_val'  : null,
   'compile_list' : subrule.Slot.compile_list.concat( [ 'min_val', 'max_val' ] ),

   'getMinVal' ( context ) {
      return this.min_val ? this.queryChar( 'slotMinVal', this, this.min_val( context ), context ) : null;
   },
   'getMaxVal' ( context ) {
      return this.max_val ? this.queryChar( 'slotMaxVal', this, this.max_val( context ), context ) : null;
   },

   'toString' ( ) {
      return "NumSlot#" + this.id;
   },

   'options' ( ) {
      var result = this.min_val && this.max_val ? [] : {};
      if ( this.min_val ) result.min = this.getMinVal();
      if ( this.max_val ) result.max = this.getMaxVal();
      if ( this.min_val && this.max_val ) {
         for ( var i = result.min; i <= result.max ; i++ ) result.push( i );
      }
      return result;
   },
   'query' ( query ) {
      if ( query.query === this.id || query.query === this.getPath() ) {
         return query.add_bonus( this.getPick( query ), this );
      }
      return base.query.call( this, query );
   },
   'query_hook' ( ) { return [ this.id ]; },
};

subrule.ProfSlot = {
   '__proto__' : subrule.Slot,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.NumSlot );
      subrule.Slot.create.call( me, opt );
      _.assert( me.prof_type, '[dd5.rule.ProfSlot] ProfSlot must have prof_type.' );
      return me;
   },
   'cid': 'subrule.profslot',
   'copy_list' : subrule.Slot.copy_list.concat( [ 'prof_type' ] ),

   'getOptions' ( context ) {
      var pick = this.getPick( context );
      var existing = this.queryChar( this.prof_type, this, undefined, context ) || [];
      var options = this.getCompatibleOptions( context );
      return options.map( e => {
         var opt = sys.Option.create( e )
         if ( e !== pick && existing.includes( e ) ) {
            opt.valid = false;
            opt.note = _.l( 'dd5.system.you_have_this_proficiency', null, e.getName() );
         }
         return opt;
      } );
   },
   'query' ( query ) {
      return setProficiency( this, query, this.prof_type, this.getPick( query ) );
   },
   'query_hook' ( ) { return [ this.id, this.prof_type ]; },
};

pinbun.event.load( 'dd5.rule.subrule' );

})( dd5 );