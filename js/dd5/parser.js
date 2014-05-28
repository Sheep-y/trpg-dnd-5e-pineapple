'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( _ && _.parser, '[dd5.loader.Parser] Sparrow parser module must be loaded first.');
_.assert( dd5 && dd5.loader, '[dd5.loader.Parser] 5e loader module must be loaded first.');
_.assert( ! dd5.loader.parser, '5e parser module already loaded.' );

(function dd5_parser_init ( ns ){

var err_parser = '[dd5.loader.Parser] ';

var p = new _.parser();

var regx_num = /^\d+(?:\.\d+)?/;
var regx_alphanum = /^\w+/;
//var regx_symbol = /^[?!:.,()\[\]<>=#@*\/+-]/;
var regx_literal = /^"(?:\\"|[^"]+)*"|'(?:\\"|[^"]+)'|[^\s?!:.,()[\]{}<>=#@*\/+-]+/; // Last part is anything not a symbol

ns.loader.parser = {
   parse : function dd5_loader_parser_parse ( exp ) {
//      try {
         return p.parse( ""+exp );
//      } catch ( e ) {
//         throw err_parser + ' Cannot parse "' + exp + '":\n' + e;
//      }
   }
};

/**
 * Parse result may be:
 *   { op: '(operator)', left, mid (tenary), right (unary), exp: (part of expression) }
 *   { type: 'num|string|ary', val }
 *   { function: 'name', param: [] }
 */
p.addRule( 'ternary' )
   .next().save( 'left' )
   .when( '?' ).save( 'op' )
      .same().save( 'mid' )
      .one( ':' ).same().save( 'right' );

p.addRule( 'compare' )
   .next().save( 'left' )
   .when( [ '>', '<', '=', '>=', '<=', '==' ] ).save( 'op' )
      .next().save( 'right' );

p.addRule( 'addminus' )
   .next().save( 'left' )
   .when( [ '+', '-' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'multiply' )
   .next().save( 'left' )
   .when( [ '*', '/' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'dot' )
   .next().save( 'left' )
      .when( '.' ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'unary1' )
   .when( [ '!', '-', '#' ] ).save( 'op' )
      .same().save( 'right' )
      .end()
   .else().next();

p.addRule( 'unary2' )
   .next().save( 'left' )
   .when( '[' ).save( 'op', '[]' )
      .top().save( 'right' )
      .end( ']' );

p.addRule( 'bracket' )
   .when( '(' ).save( 'op', '()' )
      .top().save( 'right' )
      .end( ')' )
   .else().next();

p.addRule( 'array' )
   .when( '[' ).any( '{top}', ',' ).save( 'val' ).save( 'type','ary' ).end( ']' )
   .else().next();

p.addRule( 'function' )
   .next().save( 'function' )
//   .ifwas( /\w+/ )
   .when( '(' ).any( '{top}', ',' ).save( 'param' ).end( ')' );

p.addRule( 'value' )
   .when( regx_num ).save( 'val' ).save( 'type','num' ).end()
   .else().one( regx_literal ).save( 'val' ).save( 'type','string' )
   .onparse( function dd5_template_parser_parse_value_onparse( result ) {
      if ( result.type === 'num' ) result.val = +result.val;
      return result;
   });

})( dd5 );