// ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab
/**
 *
 * sparrow_parser.js
 *
 * Sparrow parser - Generic string parser for JS
 *
 */
(function sparrow_parser_init( _ ) { 'use strict';

var Parser = function _StringParser () {
   var self = this;
   if ( ! self instanceof Parser ) self = new Parser();
   self._rules = [];
   self._map = new _.Map();
   self._reset( '' );
   return self;
};

var errns = 'sparrow.Parser';
if ( ! _ || ! _.escRegx ) throw new ReferenceError( '['+errns+'] Sparrow library must be loaded first.' );
_.parser = function _parser() { return new Parser(); };
_.parser.StringParser = Parser;

Parser.prototype = {
   skip_ws : true,
   short_result : true,

   _val : '',
   _pos : 0,
   _map : null, // {}
   _rules : null, // []
   _skip_ws_regx : /^\s+/,
   _onparse : null,

   _cache_pos : 0,
   _cache : '',
   _cur_rule : null,
   _stack : null,

   addRule : function _StringParser_addRule ( name, level ) {
      if ( typeof( name ) === 'number' && level === undefined ) {
         level = name;
         name = '';
      }
      level = ~~level;
      if ( ! level ) level = 0;
      var rule = new Parser.TopRule( name );
      var lv = this._rules[ level ];

      if ( name ) {
         if ( [ 'top', 'prev', 'next', 'same' ].indexOf( name ) >= 0 )
            throw new Error( '['+errns+'.Rule] Reserved rule name "' + name + '", please use another one.' );
      } else {
         name = level + '-' + lv ? lv.length : 0;
      }

      if ( this._map[ name ] ) throw new Error( '['+errns+'.Rule] Duplicated parsing rule {' + name + '}.' );
      this._map[ name ] = rule;
      if ( ! lv ) {
         this._rules[ level ] = lv = [ rule ];
      } else {
         lv.push( rule );
      }
      rule.level = level;
      rule.ruleno = lv.length - 1;
      rule.parser = this;
      return rule;
   },

   parse : function _StringParser_parse ( exp ) {
      this._reset( exp );
      var result = this._parseTop();
      this._skip_ws();
      if ( this._pos < this._val.length ) throw new EvalError( this._error( 'Unexpected "' + this._val[ this._pos ] + '"' ) );
      return result;
   },

   onparse : function _StringParser_onparse ( callback ) {
      if ( typeof( callback ) !== 'function' ) throw new TypeError( this._error( 'Callback parameter of onparse() must be a function.' ) );
      this._onparse = callback;
      return this;
   },

   partialParse : function _StringParser_partial_parse ( exp ) {
      this._reset( exp );
      return this._parseTop();
   },

   _getpre : function _StringParser_getpre ( ) {
      return this._val.substr( 0, this._pos );
   },

   _get : function _StringParser_get ( ) {
      if ( this._cache_pos === this._pos ) return this._cache;
      this._cache = this._val.substr( this._pos );
      this._cache_pos = this._pos;
      return this._cache;
   },

   _textpos : function _StringParser__error ( ) {
      return this._getpre() + '⁁' + this._get();
   },

   _error : function _StringParser__error ( err ) {
      return '['+errns+'] ' + err + ': ' + this._textpos();
   },

   _reset : function _StringParser__reset ( exp ) {
      if ( typeof( exp ) !== 'string' ) throw new TypeError( '['+errns+'] Expression to be parsed must be string.' );
      this._val = this._cache = exp;
      this._pos = this._cache_pos = 0;
      this._cur_rule = null;
      this._stack = new _.Map();
   },

   _skip_ws : function _StringParser_skip_ws ( ) {
      if ( ! this.skip_ws ) return;
      var m = this._get().match( this._skip_ws_regx );
      if ( m ) {
         this._pos += m[0].length;
         return m[0];
      }
      return '';
   },

   _firstRule : function _StringParser__firstRule () {
      var r = this._rules;
      return r[ r.length - 1 ][ 0 ];
   },

   _sameRule : function _StringParser__sameRule ( ) {
      if ( ! this._cur_rule ) return this._firstRule();
      return this._cur_rule;
   },

   _nextRule : function _StringParser__nextRule( ) {
      if ( ! this._cur_rule ) return this._firstRule();

      var level = this._cur_rule.level;
      var ruleno = this._cur_rule.ruleno;
      var r = this._rules[ level ];
      if ( r.length-1 > ruleno ) {
         // We are in the middle of this level; return next rule in line.
         return r[ ruleno+1 ];
      }
      // Otherwise, we are done with this level, so move to next level
      --level;
      while ( level >= 0 ) {
         r = this._rules[ level ];
         if ( r && r.length ) return r[0];
      }
   },

   _parseTop : function _StringParser__parseTop ( ) {
      var len = this._rules.length;
      if ( len <= 0 ) throw new Error( this._error( 'Cannot parse without defining rules.' ) );
      var next = this._firstRule( );
      if ( next.rules.length <= 0 ) throw new Error( this._error( 'Cannot parse with empty starting rules.' ) );
      return next._run( this )[1];
   },

//   _peek : function _StringParser__peek ( match ) {
//      //if ( match.min && this._val.length - this.pos < match.min ) return false;
//      return match.regx.test( this._get() );
//   },

   _match : function _StringParser__match ( matcher, matched ) {
      if ( matcher.regx ) {
         return !! matcher.regx.exec( matched );

      } else if ( matcher.func ) {
         return !! matcher.func( this._getpre(), matched );
      }
   },

   _eat : function _StringParser__eat ( matcher, opt ) {
      var next = this._get();
      //if ( match.min && next.length < match.min ) throw new EvalError( this._error( '['+errns+'] Expected ' + match.exp ) );
      if ( matcher.regx ) {
         // RegExp or compiled string match
         var m = matcher.regx.exec( next );
         if ( m ) {
            ++ this._cur_rule._atecount;
            this._pos += m[0].length;
            return [ m[0], m[0] ];
         }

      } else if ( matcher.func ) {
         // Function match
         var m = ~~matcher.func( this._getpre(), next );
         if ( m ) {
            var str = next.substr( 0, m );
            this._pos += m;
            return [ str, str ];
         }

      } else if ( matcher.rule ) {
         // Rule match
         var rule;
         switch ( matcher.rule ) {
            case 'next' :
               rule = this._nextRule();
               break;

            case 'top' :
               rule = this._firstRule();
               break;

            case 'same' :
               rule = this._sameRule();
               break;

            default:
               // Named rule match
               rule = this._map[ matcher.rule ];
         }
         if ( ! rule || ! rule._run ) throw new ReferenceError( this._error( 'Rule not found: {' + matcher.rule + '}'  ) );

         // Check for simple recursion
         if ( this._stack[ rule.name ] === this._pos ) throw new EvalError( this._error( 'Infinite recursion at {' + rule.name + '}' ) );
         this._stack[ rule.name ] = this._pos;

         // Preserve parser state and update rule stat
         var state = { pos : this._pos, rule : this._cur_rule };
         ++ this._cur_rule._atecount;
         ++ this._cur_rule._aterule;

         try {
            var result = rule._run( this );
            this._cur_rule = state.rule;
            this._cur_rule._lastrulematch = result;
            return result;
         } catch ( ex ) {
            // Match is not optional?
            if ( ! opt ) throw ex;
            // Match is optional and can fail safely.
            // Restore state as if nothing happened, and reply match failure
            this._pos = state.pos;
            this._cur_rule = state.rule;
            -- this._cur_rule._atecount;
            -- this._cur_rule._aterule;
         }
      }

      // When we didn't get a match...
      if ( opt ) return [ '', null ];
      throw new EvalError( this._error( 'Expected ' + matcher.exp ) );
   }
};

Parser.Rule = _.inherit( null, function _StringParser_Rule ( levelup, name ) {
   this.rules = [];
   if ( Object.defineProperty ) {
      Object.defineProperty( this, 'name', { configurable: false, enumerable: true, writable: false, value: name } );
   } else {
      this.name = name;
   }
   this._levelup = levelup;
   this._root = levelup ? levelup._root : this;
}, {
   name : null,  // readonly
   rules : null, // Child rule callbacks

   _root : null, // Top rule in this context (each 'when' and each 'else' creates a new children rule)
   _levelup : null, // Parent rule, used by end()

   // Rule parsing states
   _fulltext : null,
   _lasttext : null,
   _lastmatch : null,

   /* Proxy methods for parser */
   addRule : function _StringParser_Rule_addRule ( name, level ) { return this._root.parser.addRule( name, level ); },
   partialParse : function _StringParser_Rule_partialParse ( exp ) { return this._root.parser.partialParse( exp ); },
   parse : function _StringParser_Rule_parse ( exp ) { return this._root.parser.parse( exp ); },

   _error : function _StringParser_Rule_error ( msg ) {
      return '['+errns+'.Rule] ' + msg;
   },

   _run : function _StringParser_Rule_run ( parser, lasttext, lastmatch ) {
      this._lasttext = lasttext;
      this._lastmatch = lastmatch;
      this._fulltext = '';

      // Empty rule is legal, like an empty when or an empty else.
      var r = this.rules, text = '';
      for ( var i = 0, len = r.length ; i < len ; i++ ) {
         text += r[ i ]( parser, this );
         // Full text is updated in loop mainly for user functions (call command), and for parsing purpose can be moved after the loop.
         this._fulltext = text;
      }

      return [ this._fulltext, this._fulltext ];
   },

   shortResult : function _StringParser_Rule_shortResult ( sc ) {
      this.rules.push( function _StringParser_Rule_shortResult_exec ( parser, self ) {
         self._root._short_result = sc;
         return '';
      } );
      return this;
   },
   onparse : function _StringParser_Rule_onparse ( callback ) {
      if ( typeof( callback ) !== 'function' ) throw new TypeError( this._error( 'onparse\'s callback parameter must be a function.' ) );
      this.rules.push( function _StringParser_Rule_onparse_exec ( parser, self ) {
         self._root._onparse = callback;
         return '';
      } );
      return this;
   },

   /**
    * Save last match's result (usually a string or custom result object) or specific value to current rule's result buffer.
    *
    * @export
    * @param {string=} name Name of result.  If not given, will save last match as whole result
    * @param {*=} value Specific result value.  If given, will save this value instead of last match.
    * @returns {Parser.Rule} This rule object, for command chaining.
    */
   save : function _StringParser_Rule_save ( name, value ) {
      this.rules.push( function _StringParser_rule_save_exec ( parser, self ) {
         var val = value === undefined ? self._lastmatch : value;
         if ( name !== undefined ) {
            self._root._result[ name ] = val;
         } else {
            self._root._result = val;
         }
         return '';
      } );
      return this;
   },

   /**
    * Save last match's text (string) to current rule's result buffer.
    * This text includes leading whitespace. In case of any/some/multi, may also include trailing whitespaces
    *
    * @export
    * @param {string} name Name of result.
    * @returns {Parser.Rule} This rule object, for command chaining.
    */
   text : function _StringParser_Rule_text ( name ) {
      this.rules.push( function _StringParser_rule_text_exec ( parser, self ) {
         self._root._result[ name ] = self._lasttext;
         return '';
      } );
      return this;
   },

   /**
    * Consume whitespaces. Unlike most other commands, this command will update last match to pure whitespaces.
    * @export
    * @returns {Parser.Rule} This rule object, for command chaining.
    */
   ws : function _StringParser_Rule_next () {
      this.rules.push( function _StringParser_rule_ws_exec ( parser, self ) {
         var ws = parser._skip_ws();
         if ( ! ws ) throw new EvalError( parser._error( "Expected whitespaces" ) );
         return self._lasttext = self._lastmatch = ws;
      } );
      return this;
   },

   one : function _StringParser_Rule_one ( match, _flag ) {
      match = Parser.compile_match( match, _flag ? _flag.ci : undefined );
      this.rules.push( function _StringParser_rule_one_exec ( parser, self ) {
         var ws = parser._skip_ws();
         var ate = parser._eat( match, _flag ? _flag.optional : undefined );
         self._lastmatch = ate[1];
         return self._lasttext = ws + ate[0];
      } );
      return this;
   },
   top : function _parser_rule_top () { return this.one( '{top}' ); },
   next : function _parser_rule_next () { return this.one( '{next}' ); },
   same : function _StringParser_Rule_same () { return this.one( '{same}' ); },
   ci : function _parser_rule_ci ( match ) { return this.one( match, { ci: true } ); },
   opt : function _StringParser_Rule_opt ( match ) { return this.one( match, { optional: true } ); },
   optci : function _parser_rule_optci ( match ) { return this.one( match, { ci: true, optional: true } ); },

   any : function _StringParser_Rule_any ( match, separator ) {
      return this.multi( match, separator, [0] );
   },
   some : function _StringParser_Rule_some ( match, separator ) {
      return this.multi( match, separator, [1] );
   },
   multi: function _StringParser_Rule_many ( match, separator, bound ) {
      // Normalise and check bound parameter
      if ( bound ) {
         if ( ! ( bound instanceof Array ) ) throw new TypeError( this._error( 'multi(): Bound parameter must be an array.' ) );
      } else {
         bound = [ 0, 0 ]; // 0 to unlimited
      }
      bound[0] = ~~bound[0];
      if ( bound[1] && bound[1] < bound[0] ) throw new RangeError( this._error( 'multi(): Second value of bound parameter must be bigger then first.' ) );
      bound[1] = ~~bound[1];
      if ( bound[0] < 0 || bound[1] < 0 ) throw new RangeError( this._error( 'multi(): Bound parameter must not be negative.' ) );
      if ( bound[1] === 1 ) {
         if ( bound[0] === 0 ) { // [ 0, 1 ]
            return this.opt( match );
         } else {                // [ 1, 1 ]
            return this.one( match );
         }
      }

      // Compile match rule and separator rule.
      match = Parser.compile_match( match );
      if ( separator ) separator = Parser.compile_match( separator );

      this.rules.push( function _parser_rule_opt_exec ( parser, self ) {
         var text = parser._skip_ws();
         var result = [];
         var count = 0;
         var ate = parser._eat( match, 'optional' );
         while ( ate[1] ) { // Intentional assignment, not typo
            ++count;
            text += ate[0];
            result.push( ate[1] );
            // Exit if we have reached upper limit.
            if ( bound[1] && count >= bound[1] ) break;

            // Otherwise try to match separator (if given)
            text += parser._skip_ws();
            if ( separator ) {
               ate = parser._eat( separator, 'optional' );
               // If no separator found, break loop
               if ( ! ate[1] ) break;
               // If we have separator, append to text and prepare for next match.
               text += ate[0] + parser._skip_ws();
            }
            ate = parser._eat( match, 'optional' );
         }
         // If we have not reached lower limit, throw an exception.
         if ( count < bound[0] ) throw new EvalError( parser._error( '"' + match.exp + '" expected (min. ' + bound[0] + ')' ) );
         self._lastmatch = result;
         return self._lasttext = text;
      } );
      return this;
   },

   when : function _StringParser_Rule_when ( match ) {
      match = Parser.compile_match( match );
      var rule = new Parser.Rule( this, this.name + '.when' );
      var func = function _StringParser_rule_when_exec ( parser, self ) {
         var text = parser._skip_ws();
         var ate = parser._eat( match, 'optional' );

         // If we have match, run inner level
         if ( ate[1] ) {
            text += ate[0];
            ate = rule._run( parser, text, ate[1] );
            text += ate[0];

         // Otherwise run else, if set
         } else if ( func.otherwise ) {
            ate = func.otherwise._run( parser, text, null );
            text += ate[0];
         }
         // If there is no inner level or else, last match would be set by when.
         self._lastmatch = ate[1];
         return self._lasttext = text;
      };
      func.when = true;
      this.rules.push( func );
      return rule;
   },
   ifwas : function _StringParser_Rule_ifwas ( match ) {
      match = Parser.compile_match( match );
      if ( match.rule ) throw new TypeError( this._error( 'ifwas cannot check againt a rule (yet).' ) );
      var self = this;
      var rule = new Parser.Rule( this, this.name + '.ifwas' );
      var func = function _StringParser_rule_when_exec ( parser, self ) {
         var text = self._lasttext, ate;
         var was = parser._match( match, text );
         if ( was ) {
            ate = rule._run( parser, text, self._lastmatch );
         } else if ( func.otherwise ) {
            ate = func.otherwise._run( parser, text, self._lastmatch );
         }
         if ( ate ) {
            self._lastmatch = ate[1];
            return self._lasttext = ate[0];
         }
         return '';
      };
      func.when = true;
      this.rules.push( func );
      return rule;
   },
   end : function _StringParser_Rule_end ( match ) {
      if ( match ) this.one( match );
      return this._levelup;
   },
   else : function _StringParser_Rule_else ( ) {
      var r = this.rules, last = r.length ? r[ r.length - 1 ] : null ;
      if ( ! last || ! last.when ) throw new SyntaxError( this._error( 'else() without when() or ifwas().' ) );
      if ( last.otherwise ) throw new SyntaxError( this._error( 'when() or ifwas() already has else().' ) );

      var rule = last.otherwise = new Parser.Rule( this, this.name );
      // Do not push to rules because handled by the when login in var last.
      return rule;
   },
   /* Disabled because problem in else (stay at new level) and other chained commands (back to upper level)
   elsewhen : function _StringParser_Rule_elsewhen ( match ) {
      var otherwise = this.else();
      var when = otherwise.when( match );
      when._levelup = this; // When this 'elsewhen' ends, come back to this level.
      return when;
   }
   */

   call : function _StringParser_Rule_call ( callback ) {
      this.rules.push( function _StringParser_rule_call_exec ( parser, self ) {
         callback( {
            parser : parser,
            expression : parser._val,
            position : parser._pos,

            rule : self._root,
            childrule : self,
            result : self._root._result,
            fulltext : self._fulltext,
            lastmatch : self._lastmatch,
            lasttext : self._lasttext
         } );
         return '';
      } );
      return this;
   },

   log : function _StringParser_Rule_log ( label ) {
      if ( label === undefined ) label = '';
      else label = ' ' + label;
      this.rules.push( function _StringParser_rule_log_exec ( parser, self ) {
         _.info( {
            name : self._root.name + label,
            _position : parser._textpos(),
            _result : self._root._result,
            _lastmatch : self._lastmatch,
            _lasttext : self._lasttext,
            parser : parser,
            rule : self
         } );
         return '';
      } );
      return this;
   }
});

Parser.TopRule = _.inherit( Parser.Rule, function _StringParser_TopRule ( name ) {
   Parser.Rule.call( this, null, name );
}, {
   _onparse : null, // Callback / constructor
   _result : null,  // Result buffer for save() and text()

   _short_result : null, // Override parser short result state.
   _lastrulematch : null, // The returned result when short result.
   _atecount : null, // Count of processed _eat that is rule.  Part of short result condition.
   _aterule : null,  // Count of processed _eat.  Part of short result condition.

   // Position within parser, set by parser
   level  : null,
   ruleno : null,
   parser : null,

   _run : function _StringParser_TopRule_run ( parser ) {
      parser._cur_rule = this;
      var state = this._statesave();
      this._short_result = parser.short_result;
      this._onparse = parser._onparse;

      Parser.Rule.prototype._run.call( this, parser, '', null );

      // Save run result
      var fulltext = this._fulltext;

      // If only one consumption happened and it is a rule, return the result of that rule.
      if ( ( parser.short_result || this._short_result ) && this._aterule === 1 && this._atecount === 1 && this._short_result !== false ) {
         var result = [ fulltext, this._lastrulematch[1] ];
         this._stateload( state );
         return result;
      }

      // Otherwise prepare result object
      var result = this._result;
      if ( this._onparse ) {
         result = this._onparse( result, fulltext, this, parser );

      } else if ( _.is.object( result ) )  {
         // Set textual expression and toString as non-enumerable property of result.
         if ( result._expression === undefined ) _.set( result, '_expression', fulltext, '^e' );
         if ( result.toString === undefined ) _.set( result, 'toString', Parser.TopRule.prototype._resultToString, '^e' );
      }
      this._stateload( state );
      return [ fulltext, result ];
   },

   _statesave : function _StringParser_TopRule_statesave ( ) {
      var result = {
         result : this._result,
         rulematch : this._lastrulematch,
         aterule : this._aterule,
         atecount : this._atecount,
         short_result : this._short_result,
         onparse : this._onparse
      };
      this._atecount = 0;
      this._aterule = 0;
      this._result = new _.Map();
      this._lastrulematch = null;
      return result;
   },

   _stateload : function _StringParser_TopRule_statesave ( state ) {
      this._result = state.result;
      this._aterule = state.aterule;
      this._atecount = state.atecount;
      this._lastrulematch = state.rulematch;
      this._short_result = state.short_result;
      this._onparse = state.onparse;
   },

   _resultToString : function __StringParser_Rule_resultToString ( ) { return this._expression; },

   end : function _StringParser_TopRule_end ( match ) {
      throw new SyntaxError( this._error( 'Cannot end match logic; already at top level.' ) );
   }
});

/**
 * Pre-compile string matching parameter.
 *
 * Many rule is about matching specific string, such as one(), opt(), any(), or when().
 * This function will pre-compile the parameter to a regular expression.
 *
 * @param {string|Array|RegExp|Function} target
 * @param {boolean=} caseinsensitive If true, result pattern will always be case insensitive
 * @returns {Object} Internal match object for parameter of Parser._eat().
 */
Parser.compile_match = function _StringParser_compile_match ( target, caseinsensitive ) {
   var result, flags = '', err = '['+errns+'.Rule] ';
   if ( target === null || target === undefined ) {
      throw new ReferenceError( err + 'Match parameter must be provided.' );
   }
   if ( caseinsensitive ) flags = 'i';

   if ( typeof( target ) === 'string' ) {
      var m = /\{(.+)\}/.exec( target );
      if ( m ) {
         return { rule : m[1] };
      } else {
         result = { regx : new RegExp( '^' + _.escRegx( target ), flags ), minlen : target.length, exp : target };
      }
   }

   else if ( typeof( target ) === 'function' ) {
      result = { func : target, minlen: 0, exp: 'function ' + target.name + '(ahead,before) returns true' };
      if ( ! target.name ) result.exp = '(anonymous function) returns true';
   }

   else if ( target instanceof Array ) {
      var pattern = [], min = 0;
      target.forEach( function _StringParser_compile_match_array ( p ) {
         if ( typeof( p ) === 'string' ) {
            if ( min === 0 ) min = p.length;
            else if ( min > 0 ) min = Math.min( min, p.length );
            pattern.push( _.escRegx( p ) );

         } else if ( p instanceof RegExp ) {
            min = -1;
            pattern.push( '(?:' + p.source + ')' );
            if ( p.multiline ) _.warn( err + 'Array match RegExp m flag will be ignored. (' + p.source + ')' );
            if ( p.ignoreCase !== !!caseinsensitive ) _.warn( err + 'Array match RegExp i flag will be ignored. (' + p.source + ')' );

         } else {
            throw err + 'If match parameter is an array, its contents must be string or regular expression.';
         }
      });
      if ( min < 0 ) min = 0;
      pattern = pattern.join( '|' );
      result = { regx : new RegExp( '^(?:' + pattern + ')', flags ), minlen : min, exp : pattern };
   }

   else if ( target instanceof RegExp ) {
      flags = '';
      if ( target.multiline ) flags += 'm';
      if ( target.ignoreCase || caseinsensitive ) flags += 'i';
      result = { regx : new RegExp( '^(?:' + target.source + ')', flags ), minlen : 1, exp : '/' + target.source + '/' + flags };
   }

   if ( ! result ) throw new TypeError( err + 'Do not know how to match "' + target + '". Accepted: string, regexp, or array of string/regexp' );
   if ( result.regx.test( '' ) ) throw new SyntaxError( err + 'Pattern must not mach empty string, please use one of the rule building functions such as opt(), any(), or when()' );
   return result;
};

})( _ );