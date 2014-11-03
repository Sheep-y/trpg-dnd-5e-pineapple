'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( _ && _.parser, '[dd5.loader.Parser] Sparrow parser module must be loaded first.');
_.assert( dd5 && dd5.loader && dd5.loader.expression, '[dd5.loader.Parser] 5e expression module must be loaded first.');
_.assert( ! dd5.loader.parser, '5e parser module already loaded.' );

(function dd5_parser_init ( ns ){

var err_parser = '[dd5.loader.Parser] ';

var p = new _.parser();
var expns = ns.loader.expression;

var regx_num = /^\d+(?:\.\d+)?/;
var regx_alphanum = /^\w+/;
var regx_identifier = /[a-z_]\w*/i;
var regx_literal = /^"(?:\\"|[^"]+)*"|'(?:\\"|[^"]+)'|[a-z_]\w*/i; // Last part is anything not a symbol

ns.loader.parser = {
   parse : function dd5_loader_parser_parse ( exp ) {
      return p.parse( ""+exp );
   }
};

// Example of expressions:
// str_mod = floor((you.str-10)/2)
// prof = [2,2,2,2,3,3,3,3,4,4,4,4].(you.lv)
// #eq(type=armor,category=[light,medium])


/***************** Main rules ***********************/

/**
 * Parse result is always a subclass of Expression (ns.loader.expression.Expression)
 */
p.addRule( 'ternary' )       .onparse( dd5_parse_ternary )
   .next().save( 'left' )
   .when( /\?(?!:)/ ).save( 'op' ) // '?' NOT followed by ':'
      .same().save( 'mid' )
      .one( ':' ).same().save( 'right' );

p.addRule( 'compare' )       .onparse( dd5_parse_op )
   .next().save( 'left' )  // We can optimise the check to 3 regx, but not worth the cost in readibility
   .when( [ '>=', '>', '<>', '<=', '<', '===', '==', '=', '!==', '!=' ] ).save( 'op' )
      .next().save( 'right' );

p.addRule( 'iff' )           .onparse( dd5_parse_op )
   .next().save( 'left' )
   .when( '?:' ).save( 'op' )
      .next().save( 'right' );

p.addRule( 'addminus' )      .onparse( dd5_parse_op )
   .next().save( 'left' )
   .when( [ '+', '-' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'multiply' )      .onparse( dd5_parse_op )
   .next().save( 'left' )
   .when( [ '*', '/' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'unary' )         .onparse( dd5_parse_op )
   .when( [ '!', '-' ] ).save( 'op' )
      .same().save( 'right' )
   .end()
   .else().next();

p.addRule( 'function' )      .onparse( dd5_parse_func )
   .next().save( 'name' )
   .ifwas( regx_identifier ).when( '(' )
      .any( '{top}', ',' ).save( 'param' )
   .end( ')' );

p.addRule( 'array' )         .onparse( dd5_parse_value )
   .when( '[' )
      .any( '{top}', ',' ).save( 'val' )
   .end( ']' )
   .else().next();

p.addRule( 'dot' )           .onparse( dd5_parse_dot )
   .opt( '#' ).save( 'is_resource' )
   .next().save( 'base' )
   .ifwas( regx_identifier )
      .any( '{filter}' ).save( 'filter' )
      .when( '.' )
         .any( regx_identifier , '.' ).save( 'sequence' )
      .end();

p.addRule( 'bracket' )       .onparse( dd5_parse_bracket )
   .when( '(' )
      .top().save()
   .end( ')' )
   .else().next();

p.addRule( 'literal' )         .onparse( dd5_parse_value )
   .when( regx_num ).save( 'val' ).save( 'type','num' ).end()
   .else().one( regx_literal ).save( 'val' );

/***************** Sub rules ***********************/

p.addRule( 'filter' ) // We likely need more complicated syntax in the future, but not now.
   .one( '[' ).opt( '@' ).text( 'at' )
   .one( /\w+/ ).text( 'prop' )
   .one( '=' ).one( '{literal}' ).text( 'value' )
   .one( ']' );

/***************** On parse functions ***********************/

function dd5_parse_ternary ( data ) {
   var cache, exp = data.left.getExpression() + '?' + data.mid.getExpression() + ':' + data.right.getExpression();
   if ( cache = expns.cache( exp ) ) return cache;
   return expns.cache( exp, new expns.If( exp, data.left, data.mid, data.right ) );
}

function dd5_parse_op ( data ) {
   var cache, exp = '';
   if ( data.left  ) exp += data.left.getExpression();
   exp += data.op;
   if ( data.right ) exp += data.right.getExpression();
   if ( cache = expns.cache( exp ) ) return cache;

   var Exp = expns.map[ data.op ];
   if ( ! data.left || ! data.right ) {
      // Unary
      if ( data.op === '-' ) Exp = expns.Negative;
      var val = data.left === undefined ? data.right : data.left;
      return expns.cache( exp, new Exp( exp, val ) );
   }
   return expns.cache( exp, new Exp( exp, data.left, data.right ) );
}

function dd5_parse_dot ( data ) {
   var cache, exp = data.base.getExpression(), seq = data.sequence;
   var query = [], filter = data.filter;

   if ( data.is_resource ) {
      exp = '#' + exp;
      if ( filter.length ) {
         filter.sort( _.sorter( 'prop' ) );
         for ( var i = filter.length - 1 ; i >= 0 ; i-- )  {
            if ( ! filter.at ) query.push( filter.splice( i, 1 )[0] );
         }
         for ( var i = 0, len = filter.length ; i < len ; i++ )  {
            exp += '[' + filter[i].prop + '=' + filter[i].value + ']';
         }
         for ( var i = 0, len = query.length ; i < len ; i++ )  {
            exp += '[@' + query[i].prop + '=' + query[i].value + ']';
         }
      }
   }
   if ( seq ) {
      if ( cache = expns.cache( exp + '.' + seq.join( '.' ) ) ) return cache;
   }

   var base;
   if ( data.is_resource ) {
      base = new expns.Resource( exp, data.base.getExpression(), filter );
      if ( ! seq ) return base;
   } else {
      if ( filter.length ) throw Error( "Filter can only be applied to resource list, e.g. #entity[@type=alignment].\nCurrent: " + exp + '[@' + filter + ']' );
      base = exp;
      //if ( base instanceof expns.Value ) base = base.getExpression();
      if ( ! seq ) {
         seq = new Array(1);
      }
   }

   for ( var i = 0, len = seq.length ; i < len ; i++ ) {
      if ( seq[i] ) exp += '.' + seq[ i ];
      base = new expns.Dot( exp, base, seq[ i ] ); 
   }
   return expns.cache( exp, base );
}

function dd5_parse_bracket ( data ) {
   var cache, exp = '(' + data.getExpression() + ')';
   if ( cache = expns.cache( exp ) ) return cache;
   return expns.cache( exp, new expns.Bracket( exp, data ) );
}

function dd5_parse_func ( data ) {
   // Assumes function name is a literal.
   var cache, Exp, name = data.name.getExpression();
   var exp = name + '(';
   exp = data.param.reduce( function dd5_parse_func_exp( e, i ) {
      if ( i > 0 ) exp += ',';
      exp += e.getExpression();
   });
   exp += ')';
   
   if ( cache = expns.cache( exp ) ) return cache;
   if ( name === 'try' ) Exp = expns.Func_Try;
   else if ( [ 'floor','round','ceil','min','max' ].indexOf( name ) >= 0 ) Exp = expns.Func_Math;
   else throw new Error( 'Unknown function: "' + name + '"' );
   return expns.cache( exp, new Exp( exp, data.name, data.param ) );
}

function dd5_parse_value ( data ) {
   var cache, exp = data.val, Exp = expns.Value;
   if ( typeof( exp ) === 'string' ) {
      exp = data.val = exp.trim();
   } else {
      exp = '[' + data.val.join(',') + ']';
   }

   if ( cache = expns.cache( exp ) ) return cache;
   if ( data.type === 'num' ) {
      data.val = +data.val;
   } else if ( data.val instanceof Array ) {
      Exp = expns.Array;
   }
   return expns.cache( exp, new Exp( exp, data.val ) );
}

})( dd5 );