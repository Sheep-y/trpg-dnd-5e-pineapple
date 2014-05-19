'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.template, '[dd5.template.expression] 5e resource module must be loaded first.');
_.assert( ! dd5.template.expression, '5e expression module already loaded.' );

(function dd5_expression_init ( ns ){

var err_expression = '[dd5.template.expression] ';

/**
 * A generic expression. The value() may be number, list, object, or just about anything.
 *
 * @param {string} exp Textual expression. Mostly used in error messages for debug purpose.
 * @param {object} tree Parsed expression tree.
 */
function dd5_Template_Expression ( exp, tree ) {
   this.exp = exp;
   this.tree = tree;
   _.freeze( this );
}
dd5_Template_Expression.prototype = {
   tree : null,
   exp : null,

   toString : function dd5_Expression_toString() {
      return this.exp;
   },

   value : function dd5_Expression_value ( context ) {
      try {
         return this._recurVal( this.tree, context );
      } catch ( ex ) {
         throw err_expression + ex + " in '" + this.exp + "'";
      }
   },
   getDesc : function dd5_Expression_desc ( context ) {
      return this._recurDesc( this.tree, context );
   },

   _recurValObj : function dd5_Expression_recurValObj ( base, next, context ) {
      if ( ! base ) return base;

      var prop;
      if ( next.op === '.' ) {
         prop = this._recurVal( next.left, context );
      } else {
         prop = this._recurVal( next, context );
         next = null;
      }

      if ( base[ prop ] !== undefined ) {
         base = base[ prop ];

      } else if ( base.query ) {
         var newQuery = _.clone( context );
         newQuery.query = prop;
         delete newQuery.value;
         base = base.query( newQuery ).value;

      } else if ( base.get ) {
         if ( typeof( prop ) === 'string' ) {
            base = base.get( { id: prop } );
            if ( base.length === 1 ) base = base[ 0 ];
         }
      }

      if ( ! base || ! next ) return base;
      return this._recurValObj( base, next.right, context );
   },

   _recurNum : function dd5_Expression_recurNum ( root, context ) {
      var result = this._recurVal( root, context );
      if ( result && result.value ) result = result.value();
      else if ( typeof( result ) === 'function' ) result = result( context );
      return result;
   },

   _recurVal : function dd5_Expression_recurVal ( root, context ) {
      if ( ! root ) return null;
      var that = this;
      if ( root.type ) { // string, value, or array
         if ( root.type === 'ary' ) return root.val.map( function dd5_Template_Expression_recurVal_ary ( e ) {
            var result = that._recurVal( e, context );
            if ( result.value ) return result.value( context );
            return result;
         } );
         return root.val;
      }
      if ( root.op ) {
         switch ( root.op ) {
            case '.':
               var base = this._recurVal( root.left, context );
               if ( typeof( base ) === 'string' ) base = context[ base ];
               return this._recurValObj( base, root.right, context );
            case '#':
               var res_type = this._recurVal( root.right, context );
               root = ns.res[ res_type ];
               if ( ! root ) throw "Unknown resource type: '" + root.val + "'"; // Captured by value() so no need prefix / expression
               return root;

            case '+':
               return this._recurNum( root.left, context ) + this._recurNum( root.right, context );
            case '-':
               if ( root.left )
                  return this._recurNum( root.left, context ) - this._recurNum( root.right, context );
               else
                  return - this._recurNum( root.right, context );
            case '*':
               return this._recurNum( root.left, context ) * this._recurNum( root.right, context );
            case '/':
               return this._recurNum( root.left, context ) / this._recurNum( root.right, context );

            case '<':
               return this._recurNum( root.left, context ) < this._recurNum( root.right, context );
            case '>':
               return this._recurNum( root.left, context ) > this._recurNum( root.right, context );
            case '<=':
               return this._recurNum( root.left, context ) <= this._recurNum( root.right, context );
            case '>=':
               return this._recurNum( root.left, context ) >= this._recurNum( root.right, context );
            case '=':
            case '==':
               return this._recurVal( root.left, context ) == this._recurVal( root.right, context );

            case '()':
               return this._recurVal( root.right, context );
            case '[]':
               return this._recurVal( root.left, context )[ this._recurVal( root.right, context ) ];
            case '!':
               return ! this._recurNum( root.right, context );
            case '?':
               return this._recurVal( root.left, context ) ? this._recurVal( root.mid, context ) : this._recurVal( root.right, context );

            default :
               throw "Unknown operation: '" + root.op + "'"; // Captured by value() so no need prefix / expression
         }
      }
      if ( root.function ) {
         var param_val = function dd5_Expression_recurVal_param ( e, i ) { // i is unused but useful for debug
            return that._recurNum( e, context );
         };
         switch ( root.function ) {
            case 'random' :
               var param = root.param.map( param_val );
               if ( param.length === 0 ) return Math.random();
               if ( param.length === 1 ) return Math.random() * param[0];
               return Math.random() * ( param[1] - param[0] ) + param[0];

            case 'try' : // Error during parameter evaluation would be ignored.
               for ( var i = 0, l = param.length ; i < l ; i++ ) { try { 
                  var v = param_val( param[ i ], i );
                  if ( v !== null && v !== undefined && ! isNaN( v ) ) return v;
               } catch ( ex ) { 
                  return;
               } }
               return; // In case all of them are empty!

            default :
               // Process math functions
               var param = root.param.map( param_val );
               if ( Math[ root.function ] !== undefined ) return Math[ root.function ].apply( Math, param );
               throw "Unknown function '" + root.function + "'";
         }
      }
   },

   _recurDesc : function dd5_Expression_recurDesc ( root, context ) {
      if ( ! root ) return '';
   }

};

ns.template.expression = { 
   Expression : dd5_Template_Expression,
   create: function dd5_Template_Expression_create ( exp ) {
      // Optimise: Create simple object for simple values.
      var tree = ns.template.Parser.instance.parse( exp );
      // Optimise: Use fly weight to share same expression.
      return new dd5_Template_Expression( exp, tree );
   }
};

})( dd5 );