'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

_.assert( dd5 && dd5.template, '[dd5.template.Parser] 5e resource module must be loaded first.');
_.assert( ! dd5.template.Parser, '5e parser module already loaded.' );

(function dd5_parser_init ( ns ){

var err_parser = '[dd5.template.Parser] ';

var template = ns.template;

/**
// Hopefully can develope a generic parser that set rules with js:

addRule( 'ternary' ).next().when( '?' ).same().one( ':' ).same();

addRule( 'compare' ).next().when( [ '>', '<', '=', '>=', '<=', '==' ] ).next();

addRule( 'addminus' ).next().when( [ '+', '-' ] ).same();

addRule( 'multiply' ).next().when( [ '*', '/' ] ).same();

addRule( 'dot' ).next().when( '.' ).same();

addRule( 'unary1' )
   .when( [ '!', '-', '#' ] ).this().end();
   .else().next()

addRule( 'unary2' )
   .next()
   .when( '[' ).top().end( ']' );

addRule( 'bracket' )
   .when( '(' ).top().end( ')' )
   .else().next();

addRule( 'array' )
   .when( '[' ).any( '{top}', ',' ).end( ']' )
   .else().next();

addRule( 'function' )
   .next()
   .if ( {'type':'alp'} )
     .when( '(' )
       .any( '{top}', ',' )
     .end( ')' );

addRule( 'value' )
   .when( /\d+/, { 'type': 'num', 'val': '{token}' } ).end()
   .elsewhen( /\w+/, { 'type': 'alp', 'val': '{token}' } ).end()
   .else().one( /lit/, { 'type': 'lit', 'val': '{token}' } );

*/

/**
 * Parse result may be:
 *   { op: '(operator)', left, mid (tenary), right (unary) }
 *   { type: 'num|string|ary', val }
 *   { function: 'name', param: [] }
 */
template.Parser = _.inherit( null, function dd5_Loader_Parser( val ) {
   if ( val ) this.reset( val );
   this.parsed = [];
}, {
   val : "",
   pos : 0,
   peek_cache : undefined,

   regx_num : /^\d+(?:\.\d+)?/,
   regx_alphanum : /^\w+/,
   regx_symbol : /^[?!:.,()\[\]<>=#@*\/+-]/,
   regx_space : /^\s+/,
   regx_literal : /^"(?:\\"|[^"]+)*"|'(?:\\"|[^"]+)'|[^?!:.,()\[\]<>=#@*\/+-]+/, // Reverse of symbols

   error : function dd5_dd5_Loader_Parser_throw ( err ) {
      return err_parser + err + ': ' + this.val.substr(0,this.pos) + '⁁' + this.val.substr(this.pos);
   },

   reset : function dd5_Loader_Parser_reset ( val ) {
      if ( val !== undefined ) {
         //_.assert( typeof( val ) === 'string', err_parser + ' Only string values can be parsed.  Got ' + typeof( val ) );
         this.val = (""+val).trim();
      }
      this.pos = 0;
      this.peek_cache = undefined;
   },

   peek : function dd5_Loader_Parser_peek ( ) {
      if ( this.peek_cache !== undefined ) return this.peek_cache;
      var type, pos = this.pos, val = this.val, match;
      if ( pos >= val.length ) return this.peek_cache = null;
      if ( pos > 0 ) val = val.substr( pos );
      if ( match = val.match( this.regx_num ) ) {
         type = 'num';
      } else if ( match = val.match( this.regx_alphanum ) ) {
         type = 'alpha';
      } else if ( match = val.match( this.regx_symbol ) ) {
         type = 'symbol';
      } else if ( match = val.match( this.regx_space ) ) {
         type = 'ws';
      } else {
         //throw this.error( "Invalid character '" + this.val.substr( pos, 1 ) );
         match = val.match( this.regx_literal );
         type = 'literal';
      }
      return this.peek_cache = { type: type, val: match[0] };
   },

   token : function dd5_Loader_Parser_token ( ) {
      var result = this.peek();
      if ( result ) this.pos += result.val.length;
      this.peek_cache = undefined;
      return result;
   },

   skip_ws : function dd5_dd5_Loader_Parser_skip_ws ( ) {
      var next = this.peek();
      while ( next && next.type === 'ws' ) {
         this.token();
         next = this.peek();
      }
   },

   token_n_skip : function dd5_Loader_Parser_token_n_skip ( ) {
      var result = this.token();
      this.skip_ws();
      return result;
   },

   parse : function dd5_Loader_Parser_parse ( val ) {
      this.reset( val );
      var result = this.parse_ternary();
      if ( this.peek() ) throw this.error( 'Unexpected "' + this.peek().val + '"' );
      return result;
   },

   parse_expression : function dd5_Loader_Parser_parse_expression ( ) {
      return this.parse_ternary();
   },

   parse_ternary : function dd5_Loader_Parser_parse_ternary ( ) {
      var left = this.parse_compare(), mid, right;

      var op1 = this.peek();
      if ( ! op1 || op1.val !== '?' ) return left;
      this.token_n_skip();

      mid = this.parse_ternary();
      if ( ! mid ) throw this.error( 'Value expected after "' + op1.val + '"' );

      var op2 = this.peek();
      if ( ! op2 || op2.val !== ':' ) throw this.error( '":" expected' );
      this.token_n_skip();

      right = this.parse_ternary();
      if ( ! right ) throw this.error( 'Value expected after "' + op2.val + '"' );
      return { 'op': op1, 'op2': op2, 'left': left, 'mid' : mid, 'right': right, 'exp': left.exp + op1 + mid.exp + op2 + right.exp };
   },

   parse_compare : function dd5_Loader_Parser_parse_compare ( ) {
      var left = this.parse_addminus();
      var next = this.peek();
      if ( next && ( next.val === '>' || next.val === '<' || next.val === '=' ) ) {
         this.token_n_skip();
         var op2 = this.peek();
         if ( op2 && ( op2.val === '=' || ( next.val === '<' && op2.val === '>' ) ) ) {
            next.val += op2.val;
            this.token_n_skip();
         }
         var right = this.parse_addminus();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );
         return { 'op': next.val, 'left': left, 'right': right, 'exp': left.exp + next.val + right.exp };
      }
      return left;
   },

   parse_addminus : function dd5_Loader_Parser_parse_addminus ( ) {
      var left = this.parse_multiply();
      var next = this.peek();
      if ( next && ( next.val === '+' || next.val === '-' ) ) {
         this.token_n_skip();
         var right = this.parse_addminus();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );
         return { 'op': next.val, 'left': left, 'right': right, 'exp': left.exp + next.val + right.exp };
      }
      return left;
   },

   parse_multiply : function dd5_Loader_Parser_parse_multiply ( ) {
      var left = this.parse_dot();
      var next = this.peek();
      if ( next && ( next.val === '*' || next.val === '/' ) ) {
         this.token_n_skip();
         var right = this.parse_multiply();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );
         return { 'op': next.val, 'left': left, 'right': right, 'exp': left.exp + next.val + right.exp };
      }
      return left;
   },

   parse_dot : function dd5_Loader_Parser_parse_dot ( ) {
      var left = this.parse_unary();
      var next = this.peek();
      if ( next && next.val === '.' ) {
         this.token_n_skip();
         var right = this.parse_dot();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );
         return { 'op': next.val, 'left': left, 'right': right, 'exp': left.exp + next.val + right.exp };
      }
      return left;
   },

   parse_unary : function dd5_Loader_Parser_parse_unary ( ) {
      // Prefix
      var next = this.peek();
      if ( next && ( next.val === '-' || next.val === '!' || next.val === '#' ) ) {
         this.token_n_skip();
         var right = this.parse_unary();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );
         return { 'op': next.val, right: right, exp: next.val + right.exp };
      }

      // Middle value
      var result = this.parse_value();

      // Postfix
      next = this.peek();
      while ( next && next.val === '[' ) {
         this.token_n_skip();

         var right = this.parse_expression();
         if ( ! right ) throw this.error( 'Value expected after "' + next.val + '"' );

         next = this.peek();
         if ( ! next || next.val !== ']' ) throw this.error( '"]" expected' );
         this.token_n_skip();

         result = { 'op': '[]', 'left': result, 'right': right, exp: result.exp+'['+right.exp+']' };
         next = this.peek();
      }

      return result;
   },

   parse_value : function dd5_Loader_Parser_parse_value ( ) {
      var next = this.token_n_skip(), result;
      if ( ! next ) throw this.error( 'Value expected' );

      switch ( next.type ) {
      case 'num' :
         next.exp = next.val;
         next.val = parseFloat( next.val );
         return next;

      case 'literal' :
         next.exp = next.val;
         next.type = 'string';
         return next;

      case 'alpha' :
         // If alphanumeric, check whether it is a function.
         result = next;
         next = this.peek();
         if ( next && next.val === '(' ) {
            this.token_n_skip();
            return this.parse_function( result.val );
         }
         result.exp = result.val;
         result.type = 'string';
         return result;

      case 'symbol' :
         switch ( next.val ) {
         case '(' :
            var result = this.parse_expression();
            next = this.peek();
            if ( ! next || next.val !== ')' ) throw this.error( '")" expected' );
            this.token_n_skip();
            return { 'op': '()', 'exp': '(' + result.exp + ')', 'right': result };

         case '[' :
            result = this.parse_list();
            next = this.peek();
            if ( ! next || next.val !== ']' ) throw this.error( '"]" expected' );
            this.token_n_skip();
            return { 'type': 'ary', 'exp': '[' + result.exp + ']', 'val': result };

         default :
            throw this.error( 'Value expected, found "' + next.val + '"' );
         }

      default:
         throw this.error( 'Internal error: unexpected token type' );
      }
   },

   parse_function : function dd5_Loader_Parser_parse_function ( name ) {
      var result = { 'function': name, 'param': this.parse_list() };
      var next = this.peek();
      if ( ! next || next.val !== ')' ) throw this.error( '")" expected' );
      this.token_n_skip();
      result.exp = name + '(' + result.param.exp + ')';
      return result;
   },

   parse_list : function dd5_Loader_Parser_parse_array ( ) {
      var result = [ this.parse_expression() ];
      var exp = '';
      var next = this.peek();
      while ( next && next.val === ',' ) {
         this.token_n_skip();
         if ( this.peek() ) result.push( this.parse_expression() );
         next = this.peek();
      }
      result.exp = result.map( _.mapper( 'exp' ) ).join( ',' );
      return result;
   }
} );

template.Parser.instance = new template.Parser();

})( dd5 );