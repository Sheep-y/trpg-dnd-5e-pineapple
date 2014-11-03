'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.loader, '[dd5.loader.expression] 5e loader module must be loaded first.');
_.assert( ! dd5.loader.expression, '5e expression module already loaded.' );

(function dd5_expression_init ( ns ){

var l10n = 'dd5.expression.';
var err_expression = '[dd5.loader.expression] ';

var exp = ns.loader.expression = {
   _cache : new _.Map(),
   cache : function dd5_loader_expression_cache ( txt, obj ) {
      if ( obj ) {
         return this._cache[ txt ] = obj;
      }
      return this._cache[ txt ];
   },
   create : function dd5_loader_expression_create ( txt ) {
      var result = ns.loader.parser.parse( txt );
      // If result is plain value, do not modify it.
      if ( _.proto( result ) === exp.Value.prototype ) return result;
      // Otherwise use proxy to protect the value method with try catch.
      return new exp.Proxy( result );
   },
   map : new _.Map()
};

ns.query = function dd5_query ( txt, context ) {
   return exp.create( txt ).value( context );
};

/**
 * A generic expression. The value() may be number, list, object, or just about anything.
 *
 * @param {string} txt Textual expression. Mostly used in error messages for debug purpose.
 */
exp.Expression = function dd5_Loader_Expression ( txt ) {
   _.assert( typeof( txt ) === 'string', err_expression + ' Expression must be backed by a string phase.' );
   this._exp = txt;
};
exp.Expression.prototype = {
   _exp : null,

   getExpression : function dd5_Expression_getExpression() { return this._exp; },
   toString : function dd5_Expression_toString() { return this._exp; },
   value : function dd5_Expression_value ( context ) { throw "Unimplemented."; },
   getDesc : function dd5_Expression_desc ( context ) { return this._exp; },
   _num : function dd5_Expression_num ( val ) {
      if ( val instanceof ns.sys.Value || val instanceof exp.Expression )
         return val.value();

      else if ( val instanceof ns.res )
         return val.get();

      return val;
   },
   _desc : function dd5_Expression_desc ( subrule, context ) {
      if ( subrule.getDesc ) return subrule.getDesc( context );
      return subrule;
   }
};

exp.Proxy = _.inherit( exp.Expression, function dd5_Loader_Proxy ( value ) {
   _.assert( value instanceof exp.Expression, err_expression + ' Expression Proxy only applies to Expression.');
   this._val = value;
}, {
   _val : null,
   getExpression : function dd5_expression_Proxy_getExpression() { return this.getExpression( this._val ); },
   toString : function dd5_expression_Proxy_toString() { return this._val.toString(); },
   value : function dd5_expression_Proxy_value ( context ) {
      try {
         var result = this._val.value( context );
         if ( result instanceof ns.res ) result = result.get();
         return result;
      } catch ( ex ) {
         throw err_expression + "Cannot get value of '" + this._val._exp + "':\n" + ex;
      }
   },
   getDesc : function dd5_expression_Proxy_desc ( context ) { return this._val.getDesc( context ); }
});

exp.Value = _.inherit( exp.Expression, function dd5_expression_Value ( txt, value ) {
   exp.Expression.call( this, txt );
   _.assert( _.is.literal( value ) || value instanceof Array, err_expression + ' Value expression must be string, number, or array.' );
   this._val = value;
}, {
   _val : null,
   value : function dd5_expression_Value_value ( context ) { return this._val; }
} );

/******************************************************************************/

exp.Unary = _.inherit( exp.Value, function dd5_expression_Unary ( txt, value, l10n ) {
   exp.Expression.call( this, txt );
   _.assert( value instanceof exp.Expression, err_expression + ' Unary expression must be based on Expression.' );
   this._val = value;
   this.l10n = l10n;
}, {
   value : function dd5_expression_Unary_value ( context ) { return this._value( this._val.value( context ) ); },
   getDesc : function dd5_expression_Unary_desc ( context ) {
      return _.l( l10n + this.l10n, this.getExpression(), this._desc( this._val, context ) );
   }
} );

exp.BaseBinary = _.inherit( exp.Expression, function dd5_expression_Binary ( txt, left, right, l10n ) {
   exp.Expression.call( this, txt );
   this._left = left;
   this._right = right;
   this.l10n = l10n;
}, {
   _left : null,
   _right : null,
   l10n : null,

   value : function dd5_expression_Binary_value ( context ) {
      return this._value( this._left, this._right, context );
   },
   getDesc : function dd5_expression_Binary_desc ( context ) {
      return _.l( l10n + this.l10n, this.getExpression(), this._desc( this._left, context ), this._desc( this._right, context ) );
   }
});

exp.Binary = _.inherit( exp.BaseBinary, function dd5_expression_Binary ( txt, left, right, l10n ) {
   exp.BaseBinary.call( this, txt, left, right, l10n );
   _.assert( left instanceof exp.Expression && right instanceof exp.Expression );
}, {
   value : function dd5_expression_Binary_value ( context ) {
      return this._value( this._left.value( context ), this._right.value( context ), context );
   }
});

exp.NumericBinary = _.inherit( exp.Binary, function dd5_expression_NumericBinary ( txt, left, right, l10n ) {
   exp.Binary.call( this, txt, left, right, l10n );
}, {
   value : function dd5_expression_Binary_value ( context ) {
      return this._value( this._num( this._left.value( context ) ), this._num( this._right.value( context ) ) );
   }
});

exp.Ternary = _.inherit( exp.Expression, function dd5_expression_Ternary ( txt, left, mid, right, l10n ) {
   exp.Expression.call( this, txt );
   _.assert( left instanceof exp.Expression && mid instanceof exp.Expression && right instanceof exp.Expression );
   this._left = left;
   this._mid = mid;
   this._right = right;
   this.l10n = l10n;
}, {
   _left : null,
   _mid : null,
   _right : null,
   l10n : null,

   value : function dd5_expression_Binary_value ( context ) {
      return this._value( this._left.value( context ), this._mid.value( context ), this._right.value( context ), context );
   },
   getDesc : function dd5_expression_Binary_desc ( context ) {
      return _.l( l10n + this.l10n, this.getExpression(), this._desc( this._left, context ), this._desc( this._right, context ) );
   }
});

/**
 * @param {string} txt Textual expression.
 * @param {string|exp.Expression} name Function name
 * @param {Array} param Function parameter; Array of exp.Expression.
 * @param {string} l10n key
 */
exp.Function = _.inherit( exp.Expression, function dd5_expression_Function ( txt, name, param, l10n ) {
   exp.Expression.call( this, txt );
   this._name = name;
   this._param = param;
   this.l10n = l10n;
}, {
   _name  : null,
   _param : null,
   value  : function dd5_expression_Function_value ( context ) {
      var name = this._name;
      if ( name.value ) {
         name = name.value( context );
      }
      var param = this._param.map( function dd5_expression_Function_value_param ( e ) {
         return e.value( context ); // Resolve Expression
      } );
      return this._value( name, param );
   },
   getDesc : function dd5_expression_Function_desc ( context ) {
      var self = this;
      return _.l.apply( _, [ l10n + this.l10n, this.getExpression() ].concat( this._param.map( function dd5_expression_Function_desc_each( e ) {
         return self._desc( e, context );
      } ) ) );
   }
} );

/******************************************************************************/

exp.Array = _.inherit( exp.Value, function dd5_expression_Array ( txt, value ) {
   exp.Value.call( this, txt, value );
   _.assert( value instanceof Array );
}, {
   _val : null,
   value : function dd5_expression_Array_value ( context ) {
      return this._val.map( function dd5_expression_Array_value ( e ) {
         return e.value( context );
      });
   }
} );

exp.Bracket = _.inherit( exp.Unary, function dd5_expression_Bracket ( txt, value ) {
   exp.Unary.call( this, txt, value, 'bracket' );
}, {
   _value : function dd5_expression_Bracket_value ( value ) { return value; }
} );

exp.If = _.inherit( exp.Ternary, function dd5_expression_If ( txt, left, mid, right ) {
   exp.Ternary.call( this, txt, left, mid, right, 'if' );
}, {
   _value : function dd5_expression_If_value ( left, mid, right ) {
      if ( left === null || left === undefined || left !== left ) return right;
      return mid;
   }
} );

exp.Elvis = _.inherit( exp.Binary, function dd5_expression_Elvis ( txt, left, right ) {
   exp.Binary.call( this, txt, left, right, 'lt' );
}, {
   _value : function dd5_expression_Elvis_value ( left, right ) {
      if ( left === null || left === undefined || left !== left ) return right;
      return left;
   }
} );

exp.LT = _.inherit( exp.NumericBinary, function dd5_expression_LT ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'lt' );
}, {
   _value : function dd5_expression_LT_value ( left, right ) { return left < right; }
} );

exp.GT = _.inherit( exp.NumericBinary, function dd5_expression_GT ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'gt' );
}, {
   _value : function dd5_expression_GT_value ( left, right ) { return left > right; }
} );

exp.LTE = _.inherit( exp.NumericBinary, function dd5_expression_LTE ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'lte' );
}, {
   _value : function dd5_expression_LTE_value ( left, right ) { return left <= right; }
} );

exp.GTE = _.inherit( exp.NumericBinary, function dd5_expression_GTE ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'gte' );
}, {
   _value : function dd5_expression_GTE_value ( left, right ) { return left >= right; }
} );

exp.EQ = _.inherit( exp.NumericBinary, function dd5_expression_EQ ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'eq' );
}, {
   _value : function dd5_expression_EQ_value ( left, right ) { return left === right; }
} );

exp.NE = _.inherit( exp.NumericBinary, function dd5_expression_NE ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'ne' );
}, {
   _value : function dd5_expression_NE_value ( left, right ) { return left !== right; }
} );

exp.Not = _.inherit( exp.Unary, function dd5_expression_Not ( txt, value, l10n ) {
   exp.Unary.call( this, txt, value, 'not' );
}, {
   _value : function dd5_expression_Not_value ( val ) { return val ? false : true; }
} );

exp.Add = _.inherit( exp.NumericBinary, function dd5_expression_Add ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'add' );
}, {
   _value : function dd5_expression_Add_value ( left, right ) { return left + right; }
} );

exp.Minus = _.inherit( exp.NumericBinary, function dd5_expression_Minus ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'minus' );
}, {
   _value : function dd5_expression_Minus_value ( left, right ) { return left - right; }
} );

exp.Multi = _.inherit( exp.NumericBinary, function dd5_expression_Multi ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'multi' );
}, {
   _value : function dd5_expression_Multi_value ( left, right ) { return left * right; }
} );

exp.Divide = _.inherit( exp.NumericBinary, function dd5_expression_Divide ( txt, left, right ) {
   exp.NumericBinary.call( this, txt, left, right, 'divide' );
}, {
   _value : function dd5_expression_Divide_value ( left, right ) { return left / right; }
} );

exp.Negative = _.inherit( exp.Unary, function dd5_expression_Negative ( txt, value, l10n ) {
   if ( value instanceof exp.Value && typeof( value._val ) === 'number' ) {
      if ( value._exp[0] != '-' ) {
         return new exp.Value( '-' + value._exp    , -value._val );
      } else {
         return new exp.Value( value._exp.substr(1), -value._val );
      }
   }
   exp.Unary.call( this, txt, value, 'negative' );
}, {
   _value : function dd5_expression_Negative_value ( val ) { return - this._num( val ); }
} );

exp.Dot = _.inherit( exp.BaseBinary, function dd5_expression_Dot ( txt, left, right ) {
   exp.BaseBinary.call( this, txt, left, right ); // TODO: i18n
}, {
   _value : function dd5_expression_Dot_value ( left, right, context ) {
      if ( typeof( left ) === 'string' ) {
         left = context ? context[ left ] : null;
      } else if ( left instanceof exp.Expression ) {
         left = left.value( context );
      }
      if ( ! left || ! right ) return left;
      if ( left[ right ] ) return left[ right ];
      if ( left.query ) return left.query( right ).value; // Composite
      if ( left.get ) { // Catalog
         var list = left.get( { id: right } );
         if ( list.length <= 0 ) return null;
         return list[0];
      }
      return null;
   }
} );

exp.Resource = _.inherit( exp.Expression, function dd5_expression_Resource ( txt, base, filter ) {
   exp.Value.call( this, txt, base );
   _.assert( typeof( base ) === 'string' );
   _.assert( filter instanceof Array );
   this._filter = filter;
}, {
   _filter : null,
   value : function dd5_expression_Resource_value ( context ) {
      var val = ns.res[ this._val ], filter = this._filter;
      if ( ! val ) throw "Unknown resource type: '#" + this._val + "'";
      if ( filter && filter.length ) {
         var selector = {};
         for ( var i = 0, len = filter.length ; i < len ; i++ )  {
            selector[ filter[i].prop ] = filter[i].value;
         }
         return val.get( selector );
      }
      return val;
   }
} );

exp.Func_Try = _.inherit( exp.Function, function dd5_expression_FuncTry ( txt, name, param ) {
   exp.Function.call( this, txt, 'try', param, 'try' );
}, {
   value : function dd5_expression_FuncTry_value ( context ) {
      var p = this._param;
      for ( var i = 0, len = p.length ; i < len ; i++ ) {
         try {
            var v = p[i].value( context );
            if ( v !== undefined && v !== null && v === v ) return v;
         } catch ( ex ) {}
      }
   }
} );

exp.Func_Math = _.inherit( exp.Function, function dd5_expression_FuncMath ( txt, name, param ) {
   exp.Function.call( this, txt, name, param, name );
}, {
   _value : function dd5_expression_FuncMath_value ( name, param ) {
      param = param.map( function dd5_expression_FuncMath_value_param ( e ) {
         if ( e.value ) e = e.value(); // Resolve Value
         return e;
      } );
      return Math[ name ].apply( Math, param );
   }
} );
/*
   switch ( function_name ) {
      case 'random' :
         var param = root.param.map( param_val );
         if ( param.length === 0 ) return Math.random();
         if ( param.length === 1 ) return Math.random() * param[0];
         return Math.random() * ( param[1] - param[0] ) + param[0];
*/

exp.map = {
   '+'  : exp.Add,
   '-'  : exp.Minus,
   '*'  : exp.Multi,
   '/'  : exp.Divide,
   '!'  : exp.Not,
   '>'  : exp.GT,
   '<'  : exp.LT,
   '<>' : exp.NE,
   '>=' : exp.GTE,
   '<=' : exp.LTE,
   '='  : exp.EQ,
   '==' : exp.EQ,
   '===': exp.EQ,
   '!=' : exp.NE,
   '!==': exp.NE,
   '?:' : exp.Elvis
};

})( dd5 );