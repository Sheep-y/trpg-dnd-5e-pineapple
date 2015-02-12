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
   'dependent_attribute' : null,
   'query_hook' ( ) { return []; },
   'build' ( ) {
      var me = rule.Rule.build.call( this );
      if ( me.dependent_attribute ) {
         var obs = ( mods ) => {
            for ( var m of mods ) if ( _.ary( me.dependent_attribute ).includes( m.name ) ) {
               var c = me.getCharacter();
               if ( c ) c.remap_query( me );
               break;
            }
         };
         me.addObserver( 'attribute', ( mods ) => {
            for ( var m of mods ) if ( m.name === 'root' ) {
               if ( m.oldValue !== me ) m.oldValue.removeObserver( 'attribute', obs );
               if ( m.newValue !== me ) m.newValue.addObserver( 'attribute', obs );
            }
         } );
      }
      return me;
   },
   'characterAttributeChanged' ( name, newValue, oldValue ) {
      log.fine( `Character ${name} changed from ${oldValue} to ${newValue}.` );
      var char = this.getCharacter();
      if ( char ) char.fireAttributeChanged( name, newValue, oldValue );
   },
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
   'compile_list' : base.compile_list.concat( 'include' ),

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
   'compile_list' : base.compile_list.concat([ 'property', 'value', 'min', 'max' ]),
   'toString' ( ) {
      return "Adj." + this.property();
   },
   'query' ( query ) {
      var prop = _.array( this.property( query ) );
      if ( prop.includes( query.query ) || query.query === this.getPath() ) {
         var val = this.queryChar( 'adjValue', this, parseFloat( this.value( query ) ), query );
         if ( this.min ) val = Math.max( val, this.queryChar( 'adjMin', this, this.min( query ) ), query );
         if ( this.max ) val = Math.min( val, this.queryChar( 'adjMax', this, this.max( query ) ), query );
         return query.add_bonus( val, this.getResource() || this, _.call( this.type || null, query ) );
      }
      return base.query.call( this, query );
   },
   'query_hook' ( ) { return _.array( this.property() ); },
};

subrule.Negate = {
   '__proto__' : base,
   'create' ( opt ) {
      var me = _.newIfSame( this, subrule.Negate );
      base.create.call( me, opt );
      _.assert( me.property, '[dd5.rule.Negate] Negate must have property.' );
      return me;
   },
   'cid' : 'subrule.negate',
   'compile_list' : base.compile_list.concat([ 'property', 'negate_target', 'negate_whitelist', 'min', 'max' ]),
   'negate_target' : _.dummy,
   'negate_whitelist' : _.dummy,

   'query' ( query ) {
      if ( query.query === 'adjValue' && query.cause && query.cause.query ) {
         var prop = _.array( this.property( query ) );
         if ( ! prop.includes( query.cause.query ) ) return; // Not a property we are interested. Pass.
         // Check whether cause is target and, if yes, check whitelist
         var target = _.ary( this.negate_target( query ) );
         var { id: causeid } = target && query.whoask && query.whoask.getResource ? query.whoask.getResource() : {};
         if ( target && ( ! causeid || ! target.includes( causeid ) ) ) return; // Not from a source we are interested in
         var white = _.ary( this.negate_whitelist( query ) );
         if ( white && causeid && white.includes( causeid ) ) return; // In whitelist? We will let you go too.

         // Apply min / max to query result.
         if ( typeof( query.value ) === 'number' ) {
            if ( this.min ) query.value = Math.max( query.value, this.queryChar( 'adjMin', this, this.min( query ) ) );
            if ( this.max ) query.value = Math.min( query.value, this.queryChar( 'adjMax', this, this.max( query ) ) );
            else if ( ! this.min ) query.value = 0; // No min, no max = total negation
         }
      }
      return base.query.call( this, query );
   },
   'query_hook' ( ) { return [ 'adjValue' ]; },
}

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
      return _.l( 'dd5.attribute.proficiency' );
   },

   'value' : null,

   'compile_list' : base.compile_list.concat([ 'value', 'type' ]),

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
      _.assert( me.id && me.options, '[dd5.rule.Slot] Slot must have id and options set.' );
      return me;
   },
   'cid': 'subrule.slot',
   'options' : null, // Option list.
   'count'   : null, // How many picks.  null means always single choice, otherwise may be multiple.
   'default' : null, // Default option.
   'can_duplicate' : ()=>false, // True allow user to select duplicate items.
   'compile_list' : base.compile_list.concat([ 'options', 'count', 'default', 'can_duplicate' ]),

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
            else result = result.concat(); // We need to keep orig for the events
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
      this.characterAttributeChanged( this.id, result, orig );
   },
   'validPick' ( pick ) {
      return pick === null || this.getCompatibleOptions().includes( pick );
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
   'compile_list' : subrule.Slot.compile_list.concat([ 'min_val', 'max_val' ]),

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
      var me = _.newIfSame( this, subrule.ProfSlot );
      subrule.Slot.create.call( me, opt );
      _.assert( me.prof_type, '[dd5.rule.ProfSlot] ProfSlot must have prof_type.' );
      return me;
   },
   'cid': 'subrule.profslot',

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