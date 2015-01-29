(function sparrrow_init() { 'use strict'; // ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab
/**
 *
 * sparrow.js
 *
 * Sparrow - light weight JS library. Lower level and boarder then JQuery, not DOM oriented.
 *
 * Feature support varies by browser, target is latest IE, Chrome, Firefox
 *
 */

var ns = this;

// Simple check for browser features
//if ( ! document.querySelectorAll || !window.Storage ) {
//   alert('Please upgrade browser or switch to a new one.');
//}

/**
 * Select DOM Nodes by CSS selector.
 *
 * @expose
 * @param {(string|Node)} root Optional. Root node to select from. Default to document.
 * @param {string=} selector CSS selector to run. Has shortcut for simple id/class/tag.
 * @returns {Array|NodeList} Array or NodeList of DOM Node result.
 */
var _ = function sparrow ( root, selector ) {
   if ( selector === undefined ) {
      selector = root;
      root = document;
   }
   if ( ! selector ) return [ root ];
   // Test for simple id / class / tag, if fail then use querySelectorAll
   if ( selector.indexOf(' ') > 0 || ! /^[#.]?\w+$/.test( selector ) ) return root.querySelectorAll( selector );

   // Get Element series is many times faster then querySelectorAll
   if ( selector.charAt(0) === '#' ) {
      var result = root.getElementById( selector.substr(1) );
      return result ? [ result ] : [ ];
   }
   if ( selector.charAt(0) === '.' ) return root.getElementsByClassName( selector.substr(1) );
   return root.getElementsByTagName( selector );
};

if ( ns ) ns._ = _;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Array Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Convert an array-like object to be an array.
 *
 * @param {(Array|NodeList|*)} subject Subject to be converted.
 * @param {integer=} startpos If given, work like Array.slice( startpos ).
 * @param {integer=} length If this and startpos is given, work like Array.slice( startpos, length ).
 * @returns {Array} Clone or slice of subject.
 */
_.ary = function _ary ( subject, startpos, length ) {
   if ( ! Array.isArray( subject ) ) {
      if ( typeof( subject ) === 'string' || typeof( subject.next ) === 'function' || subject.length === undefined ) return [ subject ];
      if ( subject.length <= 0 ) return [];
      subject =  Array.from ? Array.from( subject ) : Array.prototype.concat.call( subject );
   }
   return startpos === undefined ? subject : subject.slice( startpos, length );
};

/**
 * Call forEach on an array-like object.
 * @param {(Array|NodeList|*)} subject Subject to call forEach on
 * @param {Function=} callbcak Callback function (element, index)
 * @param {*=} thisarg The 'this' argument of callback.  Passed straight to Array.forEach.
 */
_.forEach = function _forEach ( subject, callback, thisarg ) {
   if ( subject.forEach ) return subject.forEach( callback, thisarg );
   return Array.prototype.forEach.call( subject, callback, thisarg );
};

/**
 * alias of _.map
 *
 * @param {(Array|NodeList|Object)} subject Array-like object to be extracted.
 * @param {string=} column Columns (field) to extract.
 * @returns {Array} Array (if single column) or Array of Object (if multiple columns).
 */
_.col = function _col ( subject, column /* ... */) {
   return _.map( _.ary( subject ), column === undefined ? 0 : column );
};

/**
 * Returns a sorter function that sort an array of items by given fields.
 *
 * @param {string} field Field name to compare.
 * @param {boolean=} des true for a descending sorter. false for ascending sorter (default).
 * @returns {function(*,*)} Sorter function
 */
_.sorter = function _sorter ( field, des ) {
   var ab = ! des ? 1 : -1, ba = -ab;
   if ( field === undefined || field === null ) return function _sorter_val( a, b ) { return a > b ? ab : ( a < b ? ba : 0 ); };
   return function _sorter_fld( a, b ) { return a[ field ] > b[ field ] ? ab : ( a[ field ] < b[ field ] ? ba : 0 ); };
};

/**
 * Returns a sorter function that sort an array of items by given fields.
 *
 * @param {string} field Field name to compare, leave undefined to compare the value itself.
 * @param {boolean=} des true for a descending sorter. false for ascending sorter (default).
 * @returns {function(*,*)} Sorter function
 */
_.sorter.number = function _sorter_number ( field, des ) {
   var ab = ! des ? 1 : -1, ba = -ab;
   if ( field === undefined || field === null ) {
      return function _sorter_number_val( a, b ) { return +a > +b ? ab : ( +a < +b ? ba : 0 ); };
   } else {
      return function _sorter_number_fld( a, b ) { return +a[ field ] > +b[ field ] ? ab : ( +a[ field ] < +b[ field ] ? ba : 0 ); };
   }
};

/**
 * Sort given array-like data by given fields.
 *
 * @param {Array} data Data to sort. Will be modified and returned.
 * @param {string} field Field name to compare
 * @param {boolean=} des   true for a descending sort. false for ascending sort (default).
 * @returns {Array} Sorted data.
 */
_.sort = function _sort ( data, field, des ) {
   return _.ary( data ).sort( _.sorter( field, des ) );
};

/**
 * Returns a mapper function that returns a specefic field(s) of inpuc function.
 *
 * @param {string|Array} field Name of field to grab.  If array, will grab the properties in hierical order, stopping at null and undefined but not at numbers.
 * @returns {function} Function to apply mapping.
 */
_.mapper = function _mapper ( field ) {
   var arg = arguments, len = arg.length;
   if ( len <= 0 ) return _.dummy();
   if ( len === 1 && typeof( field ) === 'string' ) {
      return function _mapper_prop ( v ) { return v[ field ]; };
   }
   return function _mapper_dynamic ( v ) {
      var result = [], map_func = _.mapper._map;
      for ( var i = 0 ; i < len ; i++ ) {
         result.push( map_func( v, arg[ i ] ) );
      }
      return len === 1 ? result[0] : result;
   };
};
/** Mapper function for internal use. */
_.mapper._map = function _mapper_map( base, prop ) {
   if ( _.is.literal( prop ) ) {
      // String
      return base[ prop ];

   } else if ( Array.isArray( prop ) ) {
      // Array
      for ( var i = 0, len = prop.length ; i < len ; i++ ) {
         if ( base === undefined || base === null ) return base;
         base = base[ prop[ i ] ];
      }
      return base;

   } else {
      // Object, assume to be property map.
      var result = _.map();
      for ( var p in prop ) {
         result[ p ] = _mapper_map( base, prop[ p ] );
      }
      return result;
   }
};

/**
 * Map given array-like data.
 *
 * @param {Array} data Data to map. Will be modified and returned.
 * @param {string|Array} field Name of field to grab or mapping to perform.
 * @returns {Array} Mapped data.
 */
_.map = function _map ( data, field ) {
   if ( arguments.length === 0 ) return Object.create( null );
   return _.ary( data ).map( _.mapper.apply( null, _.ary( arguments ).slice( 1 ) ) );
};

/**
 * Return first non-null, non-undefined parameter.
 *
 * @returns {*} First non null data.  If none, returns the last argument or undefined.
 */
_.coalesce = function _coalesce ( a ) {
   for ( var i in arguments ) {
      a = arguments[ i ];
      if ( a !== undefined && a !== null ) return a;
   }
   return a;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Text Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

_.ucfirst = function _ucfirst ( txt ) {
   return txt ? txt.substr(0,1).toUpperCase() + txt.substr(1) : txt;
};

_.ucword = function _ucword ( txt ) {
   return txt ? txt.split( /\b(?=[a-zA-Z])/g ).map( ns.ucfirst ).join( '' ) : txt;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A function that literally do nothing.  This function can be shared by code that need such a dummy function.
 */
_.dummy = function _dummy () {};

/**
 * A function that returns whatever passed in.
 * @param  {*} v Any input.
 * @return {*} Output first parameter.
 */
_.echo = function _echo ( v ) { return v; };

/**
 * Call a function - but only if it is defined - and return its return value.
 *
 * @param {Function} func   function to call. Must be function, null, or undefined.
 * @param {Object} thisObj  'this' to be passed to the function
 * @param {...*} param      call parameters, can have multiple.
 * @returns {*}             Return value of called function, or undefined if function is not called or has error.
 */
_.call = function _call ( func, thisObj, param /*...*/ ) {
   if ( func === undefined || func === null ) return undefined;
   return func.apply( thisObj, _.ary(arguments, 2) );
};

/**
 * Given a function, return a function that when called multiple times, only the first call will be executed.
 *
 * Parameters passed to the returned function will be supplied to the callback as is.
 * This function will disregard any additional parameters.
 *
 * @param {Function} func  Function to call.
 * @returns {Function} Function that can be safely called multiple times without calling func more then once
 */
_.callonce = function _call ( func ) {
   if ( ! func ) return function () {};
   return function _callonce_call () {
      if ( ! func ) return; // func would be set to null after first call
      var f = func;
      func = null;
      return f.apply( this, arguments );
   };
};

/**
 * Call a function immediately after current JS stack is resolved.
 *
 * @param {function(...*)} func Function to call
 * @returns {integer} Id of callback.
 */
if ( this && this.setImmediate ) {
   _.setImmediate = this.setImmediate.bind( this );
   _.clearImmediate = this.clearImmediate.bind( this );

} else if ( this && ns.requestAnimationFrame ) {
   _.setImmediate = this.requestAnimationFrame.bind( this );
   _.clearImmediate = this.cancelAnimationFrame.bind( this );

} else {
   _.setImmediate = function setImmediate ( func ) { return setTimeout(func, 0); };
   _.clearImmediate = this.clearTimeout;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ajax / js / Cross origin inclusion
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Ajax function.
 *
 * Options:
 *   url - Url to send get request, or an option object.
 *   onload  - Callback (responseText, xhr) when the request succeed.
 *   onerror - Callback (xhr, text status) when the request failed.
 *   ondone  - Callback (xhr) after success or failure.
 *   xhr     - XMLHttpRequest object to use. If none is provided the default will be used.
 *   cor     - if true and if using IE, will use ActiveX instead of native ajax. Default true if current page is on file://
 *
 * @param {(string|Object)} option Url to send get request, or an option object.
 * @param {function(string,XMLHttpRequest)=} onload Callback (responseText, xhr) when the request succeed.
 * @returns {Object} xhr object
 */
_.ajax = function _ajax ( option, onload ) {
   if ( typeof( option ) === 'string' ) option = { url: option };
   if ( onload !== undefined ) option.onload = onload;
   if ( option.cor === undefined ) option.cor = location.protocol === 'file:';

   var url = option.url, xhr = option.xhr;
   if ( xhr === undefined ) {
      if ( option.cor && _.is.ie() ) xhr = new ActiveXObject( "Microsoft.XMLHttp" );
      if ( ! xhr ) xhr = new XMLHttpRequest();
   }
   _.info( "[AJAX] Ajax: "+url);
   xhr.open( 'GET', url );
   var finished = false;
   xhr.onreadystatechange = function _ajax_onreadystatechange () {
      if ( xhr.readyState === 4 ) {
         _.info( '[AJAX] Complete, status ' + xhr.status + ': ' + url );
         // 0 is a possible response code for local file access under IE 9 ActiveX
         if ( [0,200,302].indexOf( xhr.status ) >= 0 && xhr.responseText ) {
            _.setImmediate( function _ajax_onload_call () {
               if ( finished ) return;
               finished = true;
               _.call( option.onload, xhr, xhr.responseText, xhr );
               _.call( option.ondone, xhr, xhr );
            } );
         } else {
            _.setImmediate( function _ajax_onerror_call () {
               if ( finished ) return;
               finished = true;
               _.call( option.onerror, xhr, xhr, "HTTP Response Code " + xhr.status );
               _.call( option.ondone, xhr, xhr );
            } );
         }
         xhr.onreadystatechange = function() {}; // Avoid repeated call
      }
   };
   try {
      xhr.send();
   } catch (e) {
      _.error( 'Ajax exception on ' + url + ': ' + e );
      finished = true;
      _.call( option.onerror, xhr, xhr, e );
      _.call( option.ondone, xhr, xhr );
   }
   return xhr;
};

/**
 * Load a JavaScript from an url.
 *
 * Options:
 *   url - Url to send get request, or an option object.
 *   charset - Charset to use.
 *   type    - script type.
 *   validate - Callback; if it returns true, script will not be loaded,
 *                        otherwise if still non-true after load then call onerror.
 *   onload  - Callback (url, option) when the request succeed.
 *   onerror - Callback (url, option) when the request failed.
 *   harmony - If true, will set harmony script type for Firefox. (Overrides type in this case)
 *
 * @param {(string|Object)} option Url to send get request, or an option object.
 * @param {function(string,Object)=} onload Overrides option.onload
 * @returns {Element|undefined} Created script tag.
 */
_.js = function _js ( option, onload ) {
   if ( typeof( option ) === 'string' ) option = { url: option };
   if ( onload !== undefined ) option.onload = onload;

   // Validate before doing anything, if pass then we are done
   if ( option.validate && option.validate.call( null, url, option ) ) return _js_done( option.onload );

   var url = option.url;
   if ( option.harmony && ! option.type && _.is.firefox() ) option.type = "application/javascript;version=1.8";

   var attr = { 'src' : url };
   if ( option.charset ) attr.charset = option.charset;
   if ( option.type ) attr.type = option.type;
   if ( option.async ) attr.async = option.async;

   var e = _.create( 'script', attr );
   _.info( "[JS] Load script: " + url );

   var done = false;
   function _js_done ( callback, log ) {
      if ( done ) return;
      done = true;
      if ( log ) _.info( log );
      _.call( callback, e, url, option );
      _.call( option.ondone, e, url, option );
      if ( e && e.parentNode === document.body ) document.body.removeChild(e);
   }

   e.addEventListener( 'load', function _js_load () {
      // Delay execution to make sure validate/load is called _after_ script has been ran.
      _.setImmediate( function _js_load_delayed () {
         if ( option.validate && ! _.call( option.validate, e, url, option )  ) {
            return _js_done( option.onerror, "[JS] Script loaded but fails validation: " + url );
         }
         _js_done( option.onload, "[JS] Script loaded: " + url );
      } );
   } );
   e.addEventListener( 'error', function _js_error ( e ) {
      _js_done( option.onerror, "[JS] Script error or not found: " + url );
   } );

   if ( document.body ) {
      document.body.appendChild( e );
   } else {
      document.head.appendChild( e );
   }
   return e;
};

_.is = {
   /**
    * Detect whether browser ie IE.
    * @returns {boolean} True if browser is Internet Explorer, false otherwise.
    */
   ie : function _is_ie () {
      var result = /\bMSIE \d|\bTrident\/\d\b./.test( navigator.userAgent );
      _.is.ie = function _is_ie_result() { return result; };
      return result;
   },

   /**
    * Detect whether browser ie Firefox.
    * @returns {boolean} True if browser is Firefox, false otherwise.
    */
   firefox : function _is_firefox () {
      var result = /\bGecko\/\d{8}/.test( navigator.userAgent );
      _.is.firefox = function _is_firefox_result() { return result; };
      return result;
   },

   /**
    * Detect whether browser has Active X. Works with IE 11.
    * @returns {boolean} True if ActiveX is enabled, false otherwise.
    */
   activeX : function _is_activeX () {
      var result = false;
      try {
         result = !! new ActiveXObject( 'htmlfile' );
      } catch ( ignored ) {}
      _.is.activeX = function _is_activeX_result() { return result; };
      return result;
   },

   /**
    * Retuan true if given value is a literal value (instead of an object)
    * @param {*} val Value to check.
    * @returns {(undefined|null|boolean)} True if value is boolean, number, or string. Undefined or null if input is one of them.  False otherwise.
    */
   literal : function _is_literal ( val ) {
      if ( val === undefined || val === null ) return val;
      var type = typeof( val );
      return type === 'boolean' || type === 'number' || type === 'string';
   },

   /**
    * Retuan true if given value is an object (instead of literals)
    * @param {*} val Value to check.
    * @returns {(undefined|null|boolean)} True if value is object or function. Undefined or null if input is one of them.  False otherwise.
    */
   object : function _is_object ( val ) {
      if ( val === undefined || val === null ) return val;
      var type = typeof( val );
      return type === 'object' || type === 'function';
   },

   /**
    * Return true if input is 'true', 'on', 'yes', '1'.
    * Return false if 'false', 'off', 'no', '0'.
    * Return null otherwise.
    *
    * @param {(string|boolean|number)} val Value to check.
    * @returns {(boolean|null)} True, false, or null.
    */
   yes : function _is_yes ( val ) {
      var type = typeof( val );
      if ( type === 'string' ) {
         val = val.trim().toLowerCase();
         if ( [ 'true', 'on', 'yes', '1' ].indexOf( val ) >= 0 ) return true;
         else if ( [ 'false', 'off', 'no', '0' ].indexOf( val ) >= 0 ) return false;
      } else {
         if ( type === 'boolean' || type === 'number' ) return val ? true : false;
      }
      return null;
   }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Document parsing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Parse xml and return an xml document.
 * Will try DOMParser then MSXML 6.0.
 *
 * @param {string} txt XML text to parse.
 * @returns {Document} Parsed xml DOM Document.
 */
_.xml = function _xml ( txt ) {
   if ( window.DOMParser !== undefined ) {
      return new DOMParser().parseFromString( txt, 'text/xml' );

   } else if ( _.is.activeX() )  {
      var xml = new ActiveXObject('Msxml2.DOMDocument.6.0');
      xml.loadXML( txt );
      return xml;

   }
   throw 'XML Parser not supported';
};

/**
 * Convert XML Element to JS object.
 *
 * @param {Element} root DOM Element to start the conversion
 * @param {Object=} base  Base object to copy to.  If undefined then will create a new object.
 * @returns {Object} Converted JS object.
 */
_.xml.toObject = function _xml_toObject ( root, base ) {
   if ( base === undefined ) base = _.map();
   base.tagName = root.tagName;
   _.forEach( root.attributes, function _xml_toObject_attr_each( attr ) {
      base[attr.name] = attr.value;
   });
   _.forEach( root.children, function _xml_toObject_children_each( child ) {
      var name = child.name, obj = _xml_toObject( child );
      if ( base[name] === undefined ) {
         base[name] = obj;
      } else {
         base[name] = _.ary( base[name] );
         base[name].push( obj );
      }
   });
   return base;
};

/**
 * A) Parse html and return a dom element or a document fragment.
 * B) Set a dom element's html.
 *
 * @param {(string|DOMElement|NodeList)} txt HTML text to parse.
 * @param {string=} html HTML text to parse.
 * @returns {Node} A div element that contains parsed html as dom child.
 */
_.html = function _html ( txt, html ) {
   if ( html === undefined && typeof( txt ) === 'string' ) {
      var range = _.html.range || ( _.html.range = document.createRange() );
      var frag = range.createContextualFragment( txt );
      return frag.childElementCount > 1 ? frag : frag.firstElementChild;
   } else {
      _.forEach( _.domlist( txt ), function _html_each( e ) {
         e.innerHTML = html;
      });
   }
};

_.html.contains = function _html_contains( root, child ) {
   return root == child || ( root.compareDocumentPosition( child ) & 16 );
};

/**
 * Apply an xsl to xml and return the result of transform
 *
 * @param {(string|Document)} xml XML String or document to be transformed.
 * @param {(string|Document)} xsl XSL String or document to transform xml.
 * @returns {Document} Transformed fragment root or null if XSL is unsupported.
 */
_.xsl = function _xsl ( xml, xsl ) {
   var xmlDom = typeof( xml ) === 'string' ? _.xml( xml ) : xml;
   var xslDom = typeof( xsl ) === 'string' ? _.xml( xsl ) : xsl;
   if ( ns.XSLTProcessor ) {
      var xsltProcessor = new ns.XSLTProcessor();
      xsltProcessor.importStylesheet( xslDom );
      return xsltProcessor.transformToFragment( xmlDom, document );

   } else if ( xmlDom.transformNode ) {
      return xmlDom.transformNode( xslDom );

   } else if ( _.is.activeX() )  {
         /* // This code has problem with special characters
         var xslt = new ActiveXObject("Msxml2.XSLTemplate");
         if ( typeof( xsl === 'string' ) ) { // Must use ActiveX free thread document as source.
            xslDom = new ActiveXObject('Msxml2.FreeThreadedDOMDocument.3.0');
            xslDom.loadXML( xsl );
         }
         xslt.stylesheet = xslDom;
         var proc = xslt.createProcessor();
         proc.input = xmlDom;
         proc.transform();
         return _.xml( proc.output );
      */
         xmlDom = new ActiveXObject('Msxml2.DOMDocument.6.0');
         xmlDom.loadXML( xml );
         xslDom = new ActiveXObject('Msxml2.DOMDocument.6.0');
         xslDom.loadXML( xsl );
         var result = new ActiveXObject('Msxml2.DOMDocument.6.0');
         result.async = false;
         result.validateOnParse = true;
         xmlDom.transformNodeToObject( xslDom, result );
         return result;

   } else {
      return null;
   }
};

/**
 * Run XPath on a DOM node.
 *
 * @param {Node} node   Node to run XPath on.
 * @param {string} path XPath to run.
 * @returns {NodeList} XPath result.
 */
_.xpath = function _xpath ( node, path ) {
   var doc = node.ownerDocument;
   if ( doc.evaluate ) {
      return doc.evaluate( path, node, null, XPathResult.ANY_TYPE, null );
   } else {
      return doc.selectNodes( path );
   }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Console logging & timing.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Console log function.
 * Will automaticall switch to dir or table when subject is object or array.
 * This behaviour does not apply to info/warn/error
 *
 * @param {string} type Optional. Type of console function to run, e.g. 'info' or 'warn'. If not found then fallback to 'log'.
 * @param {*=}  msg  Message objects to pass to console function.
 */
_.log = function _log ( type, msg ) {
   if ( msg === undefined ) {
      msg = type;
      type = 'log';
   }
   if ( ns.console ) {
      if ( ! ns.console[type] ) type = 'log';
      if ( type === 'log' ) {
         if ( ns.console.table && Array.isArray( msg ) ) type = 'table';
         else if ( ns.console.dir && _.is.object( msg ) ) type = 'dir';
      };
      ns.console[type]( msg );
   }
};

/**
 * Safe console.info message.
 *
 * @param {*} msg Message objects to pass to console.
 */
_.info = function _info ( msg ) { _.log( 'info', msg ); };

/**
 * Safe console.warn message.
 *
 * @param {*} msg Message objects to pass to console.
 */
_.warn = function _warn ( msg ) { _.log( 'warn', msg ); };

/**
 * Safe console.warn message.
 *
 * @param {*} msg Message objects to pass to console.
 */
_.error = function _error ( msg ) { _.log( 'error', msg ); };

/**
 * An alert function that will stack up all errors in a 50ms window and shows them together.
 * Duplicate messages in same window will be ignored.
 *
 * @param {*} msg Message objects to pass to console.
 */
_.alert = function _alert ( msg ) {
   if ( ! _.alert.timeout ) {
      // Delay a small period so that errors popup together instead of one by one
      _.alert.timeout = setTimeout( function _error_timeout(){
         _.alert.timeout = 0;
         alert( _.alert.log );
         _.alert.log = [];
      }, 50 );
   }
   if ( _.alert.log.indexOf( msg ) < 0 ) {
      _.alert.log.push( msg );
   }
};
_.alert.timeout = 0;
_.alert.log = [];

/**
 * Coarse timing function. Will show time relative to previous call as well as last reset call.
 * Time is in unit of ms. This routine is not designed for fine-grain measurement that would justify using high performance timer.
 *
 * @param {string=} msg Message to display.  If undefined then will reset accumulated time.
 * @returns {(Array|undefined)} Return [time from last call, accumulated time].
 */
_.time = function _time ( msg ) {
   var t = _.time;
   var now = new Date();
   if ( msg === undefined ) {
      t.base = now;
      t.last = null;
      return now;
   }
   var fromBase = now - t.base;
   var fromLast = now - t.last;
   var txtLast = t.last ? ( 'ms,+' + fromLast ) : '';
   _.info( msg + ' (+' + fromBase + txtLast + 'ms)' );
   t.last = now;
   return [fromLast, fromBase];
};

if ( ns.console && ns.console.assert ) {
   _.assert = ns.console.assert.bind( ns.console );
} else {
   _.assert = _.dummy();
}

_.log.group = function _log_group( msg ) {
   if ( ns.console && ns.console.group ) return ns.console.group( msg );
   return _.log( msg );
};

_.log.collapse = function _log_groupCollapsed( msg ) {
   if ( ns.console && ns.console.groupCollapsed ) return ns.console.groupCollapsed( msg );
   return _.log( msg );
};

_.log.end = function _log_groupEnd() {
   if ( ns.console && ns.console.groupEnd ) return ns.console.groupEnd();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// String helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * HTML escape function.
 *
 * @param {string} txt  Text to do HTML escape.
 * @returns {string} Escaped text.
 */
_.escHtml = function _escHtml ( txt ) {
   if ( ! /[<&'"]/.test( txt ) ) return txt;
   //return t.replace( /&/g, '&amp;').replace( /</g, '&lt;').replace( /"/g, '&quot;' ).replace( /'/g, '&#39;' );
   return txt.replace( /[&<"']/g, function ( c ) { return { '&':'&amp;', '<':'&lt;', '"':"&quot;", "'":'&#39;' }[ c ]; });
};

/**
 * JavaScript escape function.
 *
 * @param {string} txt  Text to do JavaScript escape.
 * @returns {string} Escaped text.
 */
_.escJs = function _escJs ( txt ) {
   return txt.replace( /\r?\n/g, '\\n').replace( /'"/g, '\\$0');
};

/**
 * Regular expressoin escape function.
 *
 * @param {string} txt  Text to do regx escape.
 * @returns {string} Escaped text.
 */
_.escRegx = function _escRegx ( txt ) {
   return txt.replace( /([()?*+.\\{}[\]])/g, '\\$1' );
};

/**
 * Round function with decimal control.
 *
 * @param {number} val Number to round.
 * @param {integer=} decimal Optional. Decimal point to round to. Negative will round before decimal point. Default to 0.
 * @returns {integer} Rounded number.
 */
_.round = function _round ( val, decimal ) {
   var e = Math.pow( 10, ~~decimal );
   //if ( e === 1 ) return Math.round( val );
   return Math.round( val *= e ) / e;
};

/**
 * Convert big number to si unit or vice versa. Case insensitive.
 * Support k (kilo, 1e3), M, G, T, P (peta, 1e15)
 *
 * @param {(string|number)} val  Number to convert to unit (e.g. 2.3e10) or united text to convert to number (e.g."23k").
 * @param {integer=} decimal Optional. Decimal point of converted unit (if number to text). See _.round.
 * @returns {(string|number)} Converted text or number
 */
_.si = function _si ( val, decimal ) {
   if ( typeof( val ) === 'string' ) {
      if ( ! /^-?\d+(\.\d+)?[kmgtp]$/i.test( val ) ) return +val;
      var l = val.length-1, c = val.charAt( l ).toLowerCase();
      return val.substr( 0, l )*{'k':1e3,'m':1e6,'g':1e9,'t':1e12,'p':1e15}[c];
   } else {
      var count = 0;
      while ( val > 1000 || val < -1000 ) { val /= 1000; ++count; }
      return _.round( val, decimal ) + ['','k','M','G','T','P'][count];
   }
};

/**
 * Count the number of half width of a string.
 * CJK characters and symbols are often full width, double the width of latin characters and symbols which are half width.
 *
 * @param {string} src Text to calculate width of.
 * @returns {integer}  Character width.
 */
_.halfwidth = function _halfwidth( src ) {
   // A copy of PHP's mb_strwidth: http://www.php.net/manual/en/function.mb-strwidth.php
   var result = 0;
   for ( var i = 0, l = src.length ; i < l ; i++ ) {
      var code = src.charCodeAt( i );
      if ( code < 0x19 ) continue;
      else if ( code < 0x1FF ) result += 1;
      else if ( code < 0xFF60 ) result += 2;
      else if ( code < 0xFF9F ) result += 1;
      else result += 2;
   }
   return result;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Object helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Alias for Oblect.getPrototyeOf, except null safe.
 *
 * @param {Object|null|undefined} e Subject to get prototype of
 * @returns {Object|null|undefined} Prototype of e, or null|undefined if e is null|undefined.
 */
_.proto = function _proto ( e ) {
   if ( e === null || e === undefined || ! _.is.object( e ) ) return e;
   return Object.getPrototypeOf( e );
};

/**
 * If subject is null or is exactly same as prototype, create a new object from the prototype.
 *
 * @param {Object|null|undefined} that Subject to control creation.
 * @param {Object} prototype Prototype of result if new object need to be created.
 * @returns {Object|null|undefined} Prototype of e, or null|undefined if e is null|undefined.
 */
_.newIfSame = function _newIfSame ( that, prototype ) {
   if ( that === undefined || that === null ) that = prototype;
   return that !== prototype ? that : Object.create( prototype );
};

/**
 * Create a subclass from a base class.
 * You still need to call super in constructor and methods, if necessary.
 *
 * @param {(Object|null)} base Base constructor. Result prototype will inherit base.prototype.
 * @param {(function(...*)|null)} constructor New object's constructor function. Optional.
 * @param {Object=} prototype Object from which to copy properties to result.prototype. Optional.
 * @returns {Function} Result subclass function object.
 */
_.inherit = function _inherit ( base, constructor, prototype ) {
   _.assert( ! base || base.prototype, _inherit.name + ': base must be inheritable' );
   _.assert( constructor === null || typeof( constructor ) === 'function', _inherit.name + ': constructor must be function' );
   if ( constructor === null ) {
      if ( base ) constructor = function _inherit_constructor () { base.apply( this, arguments ); };
      else constructor = function _dummy_constructor () {}; // Must always create new function, do not share it
   }
   if ( base ) {
      var proto = constructor.prototype = Object.create( base.prototype );
      if ( prototype ) _.extend( proto, prototype );
   } else {
      constructor.prototype = prototype;
   }
   return constructor;
};

/**
 * Add properties from one object to another.
 * Properties owned by target will not be overwritten, but inherited properties may be copied over.
 * Similiarly, properties owned by subsequence arguments will be copied, but not inherited properties.
 *
 * @param {Object} target Target object, will have its properties expanded.
 * @param {Object} copyFrom An object with properties
 * @returns {Object} Extended target object
 */
_.extend = function _extend( target, copyFrom ) {
   var prop = [], exists = Object.getOwnPropertyNames( target );
   if ( Object.getOwnPropertySymbols ) exists = exists.concat( Object.getOwnPropertySymbols( target ) );
   for ( var i = 1, len = arguments.length ; i < len ; i++ ) {
      var from = arguments[ i ], keys = Object.getOwnPropertyNames( from );
      if ( Object.getOwnPropertySymbols ) keys = keys.concat( Object.getOwnPropertySymbols( from ) );
      keys.forEach( function _extend_copy_prop ( name ) {
         if ( exists.indexOf( name ) < 0 ) {
            prop[ name ] = Object.getOwnPropertyDescriptor( from, name );
            exists.push( name );
         }
      } );
   }
   Object.defineProperties( target, prop );
   return target;
};

/**
 * Remove properities from an object.
 * @param {Object} target Target object, will have its properties removed.
 * @param {*} prop Array like property list, or an object with properties.
 * @returns {Object} Curtailed target object
 */
_.curtail = function _curtail( target, prop ) {
   if ( prop.length !== undefined ) prop = _.ary( prop );
   else prop = Object.keys( prop );
   prop.forEach( function _curtail_each( e ) {
      if ( target.hasOwnProperty( e ) ) delete target[ e ];
   });
   return target;
};

// Prevent changing properties
_.freeze = Object.freeze ? function _freeze ( o ) { return Object.freeze(o); } : _.echo;
// Prevent adding new properties and removing old properties
_.seal = Object.seal ? function _seal ( o ) { return Object.seal(o); } : _.echo;
// Prevent adding new properties
_.noExt = Object.preventExtensions ? function _noExt ( o ) { return Object.preventExtensions(o); } : _.echo;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DOM manipulation
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Call 'preventDefault' (if exist) and return false.
_.noDef = function _noDef ( e ) { if ( e && e.preventDefault ) e.preventDefault(); return false; };

/**
 * Create a DOM element and set its attributes / contents.
 *
 * Creating 'script' should also set the async attribute, whether to enable or prevent async execution.
 *
 * @param {string} tag Tag name of element to create.
 * @param {(Object|string)=} attr Text content String, or object with properties to set. e.g. text, html, class, onclick, disabled, style, etc.
 * @returns {Element} Created DOM element.
 */
_.create = function _create ( tag, attr ) {
   /* Disabled Id/class parsing because just the check cause slow down of 6% to 12%, and does not do anything new. *
   if ( typeof( attr ) !== 'object' ) attr = { 'text' : attr }; // Convert text / numeric attribute to proper attribute object
   if ( tag.indexOf( '#' ) > 0  || tag.indexOf( '.' ) > 0 ) { // Parse 'table.noprint.fullwidth#nav' into tag, class, id
      if ( ! attr ) attr = {}; // Create attribute object if not given
      tag.split( /(?=[#.])/ ).forEach( function( e, i ) {
         if ( i === 0 ) return tag = e; // Set first token as tag name
         if ( e.charAt(0) === '#') return attr.id = e.substr(1); // Set id
         if ( ! attr.className ) return attr.className = e.substr(1); // Set className
         attr.className += ' ' + e.substr(1); // Append className
      } );
   }
   */
   var result = document.createElement( tag );
   if ( attr ) {
      if ( typeof( attr ) !== 'object' ) {
         result.textContent = attr;
      } else {
         _.attr( result, attr );
      }
   }
   return result;
};

/**
 * Convert selector / DOM element / NodeList / array of Node to array-like node list.
 *
 * @param {(string|Node|NodeList|Array)} e Selector or element(s).
 * @returns {(NodeList|Array)} Array-like list of e.
 */
_.domlist = function _domlist ( e ) {
   if ( typeof( e ) === 'string' ) return _( e );
   else if ( e.tagName || e.length === undefined ) return [ e ];
   return e;
};

/**
 * Set a list of object's same attribute/property to given value
 * If object is selector or dom element list, this function is same as _.attr( ary, obj, value ).
 *
 * @param {(string|Node|NodeList|Array|Object)} ary Element selcetor, dom list, or Array of JS objects.
 * @param {(Object|string)} obj Attribute or attribute object to set.
 * @param {*=} value Value to set.
 * @param {string=} flag w for non-writable, e for non-enumerable, c for non-configurable.  Can start with '^' for easier understanding.
 * @returns {Array} Array-ifed ary
 */
_.set = function _set ( ary, obj, value, flag ) {
   // Forward to _.attr if looks like DOM stuff
   if ( typeof( ary ) === 'string' || ( ary && ary[0] instanceof Element ) ) {
      if ( flag && flag !== '^' ) throw new Error( 'Property flags cannot be set on DOM elements' );
      return _.attr( ary, obj, value );
   }
   // Normalise obj to attr.  e.g. given 'val', it will become {'val':'val'}
   var attr = obj, setFunc;
   if ( _.is.literal( obj ) ) {
      attr = {};
      attr[ obj ] = value;
   }
   ary = _.ary( ary );
   // Actual run
   if ( ! flag || flag === '^' || ! Object.defineProperties ) {
      setFunc = function _setEach ( e ) {
         for ( var name in attr ) {
            e[ name ] = attr[ name ];
         }
      };

   } else {
      // Need to set property properties.
      flag = flag.toLowerCase();
      var prop = {}
        , c = flag.indexOf( 'c' ) < 0  // False if have 'c'
        , e = flag.indexOf( 'e' ) < 0  // False if have 'e'
        , w = flag.indexOf( 'w' ) < 0; // False if have 'w'
      for ( var name in attr ) {
         prop[ name ] = {
           value : attr[ name ],
           configurable : c,
           enumerable : e,
           writable : w
         };
      };
      setFunc = function _defineEach ( e ) {
         Object.defineProperties( e, prop );
      };
   }
   ary.forEach( setFunc );
   return ary;
};

/**
 * Safe method to get an object's prototype
 *
 * @param {*} base Base object to get prototype.
 * @returns {Object|undefined|null} Null or undefined if base cannot have prototype.  Otherwise Object.getPrototypeOf.
 */
_.proto = function _proto ( base ) {
   if ( base === undefined || base === null ) return base;
   if ( ! _.is.object( base ) ) return;
   return Object.getPrototypeOf( base );
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DOM Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Set a list of object's DOM attribute to set to given value.
 * Can also mass add event listener.
 * Please use _.css to set specific inline styles.
 *
 * @param {(string|Node|NodeList|Array)} ary Element selcetor, dom list, or Array of JS objects.
 * @param {(Object|string)} obj DOM attribute or attribute object to set.  text = textContent, html = innerHTML, class = className, onXXX = XXX addEventListener.
 * @param {*=} value Value to set.  If 'undefined' then will delete the attribute.
 * @returns {Array} Array-ifed ary
 */
_.attr = function _attr( ary, obj, value ) {
   var attr = obj;
   if ( _.is.literal( obj ) ) {
      attr = {};
      attr[ obj ] = value;
   }
   ary = _.ary( _.domlist( ary ) );
   ary.forEach( function _attr_each( e ) {
      for ( var name in attr ) {
         switch ( name ) {
            case 'text':
            case 'textContent' :
               e.textContent = attr.text;
               break;

            case 'html':
            case 'innerHTML' :
               e.innerHTML = attr.html;
               break;

            case 'class' :
            case 'className' :
               e.className = attr[ name ];
               break;

            case 'style' :
               if ( typeof( attr[ name ] ) === 'object' ) {
                  _.style( e, attr[ name ] );
                  break;
               }
               // Else fall through as set/remove style attribute

            default:
               if ( name.substr( 0, 2 ) === 'on' ) {
                  e.addEventListener( name.substr( 2 ), attr[ name ] );
               } else {
                  if ( attr[ name ] !== undefined ) {
                     e.setAttribute( name, attr[ name ] );
                  } else {
                     e.removeAttribute( name );
                  }
               }
         }
      }
   } );
   return ary;
};

/**
 * Set a list of object's style's attribute/property to same value
 *
 * @param {(string|Node|NodeList|Array)} ary Element selcetor, dom list, or Array of JS objects.
 * @param {(Object|string)} obj Style attribute or attribute object to set.
 * @param {*=} value Value to set.  If 'undefined' then will also delete the style attribute.
 * @returns {Array} Array-ifed ary
 */
_.style = function _style ( ary, obj, value ) {
   var attr = obj;
   if ( typeof( attr ) === 'string' ) {
      attr = {};
      attr[ obj ] = value;
   }
   if ( typeof( ary ) === 'string' ) ary =_( ary );
   ary = _.ary( ary );
   ary.forEach( function _styleEach ( e ) {
      for ( var name in attr ) {
         if ( attr[ name ] !== undefined ) {
            e.style[ name ] = attr[ name ];
         } else {
            e.style[ name ] = '';
            delete e.style[ name ];
         }
      }
   } );
   return ary;
};

/**
 * Show DOM elements by setting display to ''.
 * Equals to _.style( e, 'display', undefined )
 *
 * @param {(string|Node|NodeList|Array)} e Selector or element(s).
 * @returns {Array} Array-ifed e
 */
_.show = function _show ( e ) { return _.style( e, 'display', undefined ); };

/**
 * Hide DOM elements by setting display to 'none'.
 * Equals to _.style( e, 'display', 'none' )
 *
 * @param {(string|Node|NodeList|Array)} e Selector or element(s).
 * @returns {Array} Array-ifed e
 */
_.hide = function _show ( e ) { return _.style( e, 'display', 'none' ); };

/**
 * Set DOM elements visibility by setting display to '' or 'none.
 *
 * @param {(string|Node|NodeList)} e Selector or element(s).
 * @param {boolean} visible If true then visible, otherwise hide.
 * @returns {Array} Array-ifed e
 */
_.visible = function _visible ( e, visible ) {
   return visible ? _.show( e ) : _.hide( e );
};

/**
 * Clear a DOM elements of all children.
 *
 * @param {(string|Node|NodeList)} e Selector or element(s).
 * @returns {Array} Array-ifed e
 */
_.clear = function _clear ( e ) {
   _.forEach( e = _.domlist( e ), function _clear_each ( p ) {
      var c = p.firstChild;
      if ( ! c ) return;
      do {
         p.removeChild( c );
         c = p.firstChild;
      } while ( c );
   } );
   return e;
};

/**
 * Check whether given DOM element(s) contain a class.
 *
 * @param {(string|Node|NodeList)} e Selector or element(s).
 * @param {string} className  Class to check.
 * @returns {boolean} True if any elements belongs to given class.
 */
_.hasClass = function _hasClass ( e, className ) {
   // TODO: May fail when e returns a domlist, e.g. if passed a selector?
   return _.domlist( e ).some( function(c){ return c.classList.contains( className ); } );
};

/**
 * Adds class(es) to DOM element(s).
 *
 * @param {(string|Node|NodeList)} e Selector or element(s).
 * @param {(string|Array)} className  Class(es) to add.  Can be String or Array of String.
 * @returns {Array|NodeList} Array-ifed e
 */
_.addClass = function _addClass ( e, className ) { return _.toggleClass( e, className, 'add' ); };

/**
 * Removes class(es) from DOM element(s).
 *
 * @param {(string|Node|NodeList)} e Selector or element(s). If ends with a class selector, it will become default for className.
 * @param {(string|Array)} className  Class(es) to remove.  Can be String or Array of String.
 * @returns {Array|NodeList} Array-ifed e
 */
_.removeClass = function _removeClass ( e, className ) { return _.toggleClass( e, className, 'remove' ); };

/**
 * Adds or removes class(es) from DOM element(s).
 *
 * @param {(string|Node|NodeList)} e Selector or element(s).
 * @param {(string|Array)} className  Class(es) to toggle.  Can be String or Array of String.
 * @param {string=} method classList method to run.  Default to 'toggle'.
 * @returns {Array|NodeList} Array-ifed e
 */
_.toggleClass = function _toggleClass ( e, className, method ) {
   if ( method === undefined ) method = 'toggle';
   var cls = _.ary( className );
   _.forEach( _.domlist( e ), function _toggleClass_each ( dom ) {
      cls.forEach( function _toggleClass_each_each( c ) { dom.classList[ method ]( c ); } );
   } );
   return e;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Asynchronous programming
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: Can be replaced by Promise?

/**
 * Countdown Latch object
 *
 * @constructor
 * @param {integer} countdown Initial countdown value; optional. Default 0.
 * @param {function()} ondone Callback when count_down reduce count to 0.
 * @returns {_.Latch} Created Latch object
 */
_.Latch = function _Latch ( countdown, ondone ) {
   if ( typeof( countdown ) === 'function' ) {
      ondone = countdown;
      countdown = 0;
   }
   this.count = countdown;
   this.ondone = ondone;
};
_.Latch.prototype = {
   "count" : 0,
   "ondone" : null,

   /**
    * Count up.
    * @param {integer} value Value to count up.  Default 1.
    */
   "count_up" : function _latch_countup ( value ) {
      if ( value === undefined ) value = 1;
      this.count += value;
   },

   /**
    * Count down.  If count reach 0 then run ondone.
    * @param {integer} value Value to count down.  Default 1.
    * @throws {string} If count down will reduce count to below 0.
    */
   "count_down" : function _latch_countdown ( value ) {
      if ( value === undefined ) value = 1;
      this.count -= value;
      if ( this.count < 0 )
         throw new Error( "IllegalStateException: Latch count below zero" );
      if ( this.count === 0 ) _.call( this.ondone, this );
   },

   /**
    * Return a function that can be used to countdown this latch.
    * This function will work on this latch regardless of context.
    * @param {integer} value Value to count down.  Default 1.
    */
   "count_down_function" : function _latch_countdown_function ( value ) {
      var latch = this;
      return function _latch_countdown_callback() { latch.count_down( value ); };
   }
};

/**
 * Create a new executor
 *
 * @constructor
 * @param {integer} thread   Max. number of parallel jobs.
 * @param {integer} interval Minimal interval between job start.
 * @returns {_.Executor}  New executor object
 */
_.Executor = function _Executor ( thread, interval ) {
   if ( thread ) this.thread = thread;
   if ( interval ) this.interval = interval;
   this.running = [];
   this.waiting = [];
};
_.Executor.prototype = {
   "_paused": false, // Whether this executor is paused.
   "_lastRun": 0, // Last job run time.
   "_timer" : 0,  // Timer for next notice() event, if interval > 0.
   "thread" : 1,
   "interval": 0,
   "running": [],
   "waiting": [],
   "add": function _executor_add ( runnable, param /*...*/ ) {
      return this.addTo.apply( this, [ this.waiting.length ].concat( _.ary( arguments ) ) );
   },
   "asap": function _executor_asap ( runnable, param /*...*/ ) {
      return this.addTo.apply( this, [0].concat( _.ary( arguments ) ) );
   },
   "addTo": function _executor_addTo ( index, runnable, param /*...*/ ) {
      if ( ! runnable.name ) runnable.name = runnable.toString().match(/^function\s+([^\s(]+)/)[1];
      _.info('Queue task ' + runnable.name );
      var arg = [ runnable ].concat( _.ary( arguments, 2 ) );
      this.waiting.splice( index, 0, arg );
      return this.notice();
   },
   "finish" : function _executor_finish ( id ) {
      var r = this.running[id];
      _.info('Finish task #' + id + ' ' + r[0].name );
      this.running[id] = null;
      return this.notice();
   },
   "clear"  : function _executor_clear () { this.waiting = []; },
   "pause"  : function _executor_pause () { this._paused = true; if ( this._timer ) clearTimeout( this._timer ); return this; },
   "resume" : function _executor_resume () { this._paused = false; this.notice(); return this; },

   /**
    * Check state of threads and schedule tasks to fill the threads.
    * This method always return immediately; tasks will run after current script finish.
    *
    * @returns {_.Executor}
    */
   "notice" : function _executor_notice () {
      this._timer = 0;
      if ( this._paused ) return this;
      var exe = this;

      function _executor_schedule_notice ( delay ) {
         if ( exe._timer ) clearTimeout( exe._timer );
         exe._timer = setTimeout( exe.notice.bind( exe ), delay );
         return exe;
      }

      function _executor_run ( ii, r ){
         _.info('Start task #' + ii + ' ' + r[0].name );
         try {
            if ( r[0].apply( null, [ ii ].concat( r.slice(1) ) ) !== false ) exe.finish( ii );
         } catch ( e ) {
            _.error( e );
            exe.finish( ii );
         }
      }

      var delay = this.interval <= 0 ? 0 : Math.max( 0, -(new Date()).getTime() + this._lastRun + this.interval );
      if ( delay > 12 ) return _executor_schedule_notice ( delay ); // setTimeout is not accurate so allow 12ms deviations
      for ( var i = 0 ; i < this.thread && this.waiting.length > 0 ; i++ ) {
         if ( ! this.running[i] ) {
            var r = exe.waiting.splice( 0, 1 )[0];
            exe.running[i] = r;
            //_.info('Schedule task #' + i + ' ' + r[0].name );
            exe._lastRun = new Date().getTime();
            _.setImmediate( _executor_run.bind( null, i, r ) );
            if ( exe.interval > 0 ) return _executor_schedule_notice ( exe.interval );
         }
      }
      return this;
   }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Other helper objects
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A event manager with either fixed event list or flexible list.
 *
 * @constructor
 * @param {Array=} events Array of event names. Optional. e.g. ['click','focus','hierarchy']
 * @param {Object=} owner Owner of this manager, handlers would be called with this object as the context. Optional.
 * @returns {_.EventManager}
 */
_.EventManager = {
   "create" : function ( events, owner ) {
      var that = _.newIfSame( this, _.EventManager );
      if ( events !== undefined && events !== null ) that.events = events;
      that.owner = owner;
      that.lst = _.map();
      that.event_buffer = null;
      that.timer_stack = null;
      return that;
   },
   "lst" : _.map(), // Observer list by event name
   "owner" : null, // Owner, as context of handler calls.
   "events" : [], // List of events.  If empty, allow arbitrary events.
   "deferred" : false,     // Whether this manager's event firing is deferred and consolidated.
   "event_buffer" : null, // Buffered events.
   "timer_stack" : null, // Timer stacks.
   "log" : false,        // If true, will log event firing.
   /**
    * Register an event handler.  If register twice then it will be called twice.
    *
    * @param {(string|Array)} event Event to register to.
    * @param {(Function|Array)} listener Event handler.
    */
   "add" : function ( event, listener ) {
      var thisp = this;
      // TODO: Made compatible with iterable
      if ( event.forEach ) return event.forEach( function ( e ){ thisp.add( e, listener ); } );
      if ( listener.forEach ) return listener.forEach( function ( l ){ thisp.add( event, l ); } );
      var lst = this.lst[ event ];
      if ( ! lst ) {
         if ( this.events && this.events.indexOf( event ) < 0 )
            throw new Error( "[sparrow.EventManager.add] Cannot add to unknown event '" + event + "'" );
         lst = this.lst[ event ] = [];
      }
      if ( this.log ) _.log( "Add " + event + " listener: " + listener );
      lst.push( listener );
   },
   /**
    * Un-register an event handler.
    *
    * @param {(string|Array)} event Event to un-register from.
    * @param {(Function|Array)} listener Event handler.
    */
   "remove" : function ( event, listener ) {
      var thisp = this;
      // TODO: Made compatible with iterable
      if ( event.forEach ) return event.forEach( function( e ){ thisp.remove( e, listener ); } );
      if ( listener.forEach ) return listener.forEach( function( l ){ thisp.remove( event, l ); } );
      var lst = this.lst[ event ];
      if ( ! lst ) {
         if ( this.events && this.events.indexOf( event ) < 0 )
            throw new Error( "[sparrow.EventManager.remove] Cannot remove from unknown event '" + event + "'" );
         return;
      }
      var i = lst.indexOf( listener );
      if ( i >= 0 ) {
         if ( this.log ) _.log( "Remove " + event + " listener: " + listener );
         lst.splice( i, 1 );
         if ( lst.length < 0 ) delete this.lst[ event ];
      }
   },
   /**
    * Check whether given event has or has no listeners.
    *
    * @param {string*} event Event to check. Obmit to check all events.
    * @returns {Boolean} true if event has no listeners. false otherwise.
    */
   "isEmpty" : function ( event ) {
      if ( event ) return this.lst[ event ] ? false : true;
      else for ( var i in this.lst ) return false;
      return true;
   },
   /**
    * Fire an event that triggers all registered handler of that type.
    * Second and subsequence parameters will be passed to handlers.
    *
    * @param {string} event Event to call.
    * @param {...*} param Parameters to pass to event handlers.
    */
   "fire" : function ( event, param ) {
      var thisp = this, lst = this.lst[ event ], args = _.ary( arguments, 1 );
      if ( event.forEach ) {
         return event.forEach( function( e ){ thisp.fire.apply( thisp, [ e ].concat( args ) ); } );
      }
      if ( ! lst ) {
         if ( this.events && this.events.indexOf( event ) < 0 )
            throw new Error( "[sparrow.EventManager.fire] Cannot fire unknown event '" + event + "'" );
         return;
      }
      if ( ! this.deferred ) {
         if ( this.log ) _.log( "Fire " + event + " on " + l + " listeners" );
         for ( var i in lst ) lst[ i ].apply( this.owner, args );
      } else {
         lst = null;
         if ( arguments.length > 2 ) throw new Error( "[sparrow.EventManager.fire] Deferred event firing must have at most one parameter." );
         if ( ! this.event_buffer ) {
            this.event_buffer = _.map();
            this.timer_stack = _.map();
         }
         var buf = this.event_buffer[ event ] || ( this.event_buffer[ event ] = [] );
         buf.push( param );
         if ( this.timer_stack[ event ] ) return;
         // Deferred mode will consolidate all jobs and call all listeners.
         this.timer_stack[ event ] = _.setImmediate( function () {
            lst = thisp.lst[ event ]; // lst may have been recreated
            if ( ! lst ) return;
            if ( thisp.log ) _.log( "Fire deferred " + event + " event on " + l + " listeners" );
            for ( var i = 0, l = lst.length ; i < l ; i++ ) {
               lst[ i ].call( thisp.owner, buf );
            }
            buf.length = thisp.timer_stack[ event ] = 0;
         } );
      }
   },
   /** Create methods to fire event for given event list or method:event mapping */
   "createFireMethods" : function ( event ) {
      var self = this;
      function _EventManager_createFireMethods_make( prop, evt ) {
         if ( ! self.hasOwnProperty( evt ) ) {
            self[ prop ] = self.fire.bind( self, evt );
         } else {
            _.warn( '[sparrow.EventManager.createFireMethods] Fire method "' + prop + "' cannot be created." );
         }
      }
      if ( ! event || event.forEach ) {
         _.forEach( event || this.events, function ( e ) { _EventManager_createFireMethods_make( e, e ); } );
      } else {
         for ( var prop in event ) _EventManager_createFireMethods_make( prop, event[ prop ] );
      }
   }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Internationalisation and localisation
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Get language string and, if additional parameters are provided, format the parameters
 *
 * @param {string} path Path of resource to get
 * @param {*=} defaultValue Default value to use if target resource is unavailable.
 * @param {...*} param Parameters to replace %1 %2 %3 etc.
 */
_.l = function _l ( path, defaultValue, param /*...*/ ) {
   var l = _.l;
   var result = l.getset( l.currentLocale, path, undefined );
   if ( result === undefined ) result = defaultValue !== undefined ? defaultValue : path;
   if ( arguments.length > 2 ) {
      if ( arguments.length === 3 ) return l.format( ""+result, param );
      else return l.format.apply( this, [result].concat( _.ary(arguments, 2) ) );
   }
   return result;
};

/**
 * Format a string by replacing %1 with first parameter, %2 with second parameter, etc.
 *
 * @param {string} input String to format
 * @param {...*} param Parameters
 * @returns {string}
 */
_.l.format = function _l_format ( input, param /*...*/ ) {
   for ( var i = 1, l = arguments.length ; i < l ; i++ )
      input = input.replace( '%'+i, arguments[i] );
   return input;
};

/** Current locale for set and get operations. */
_.l.currentLocale = 'en';

/** Fallback locale in case localisation is not found */
_.l.fallbackLocale = 'en';

/** L10n resources. */
_.l.data = _.map();

/**
 * Set current locale.
 *
 * @param {string} lang  Locale to use. Pass in empty string, null, false etc. to use auto-detection
 */
_.l.setLocale = function _l_setLocale ( lang ) {
    if ( ! lang ) return _.l.detectLocale();
    if ( lang === _.l.currentLocale ) return;
    _.l.currentLocale = lang;
    _.l.event.fire( 'locale', lang );
};

/**
 * Override auto detect locale.
 *
 * @param {string} lang  Locale to use and save.
 */
_.l.saveLocale = function _l_saveLocale ( lang ) {
    if ( window.localStorage ) {
       if ( lang ) localStorage['_.l.locale'] = lang;
       else delete localStorage['_.l.locale'];
    }
    _.l.setLocale( lang );
};

/**
 * Detect user locale.  First check local session then check language setting.
 *
 * @param {string=} defaultLocale  Default locale to use.
 * @return {string} Current locale after detection.
 */
_.l.detectLocale = function _l_detectLocale ( defaultLocale ) {
   var l = _.l;
   if ( defaultLocale ) l.fallbackLocale = defaultLocale;
   // Load and check preference
   var pref = navigator.language || navigator.userLanguage;
   if ( window.localStorage ) pref = localStorage['_.l.locale'] || pref;
   if ( pref ) { // Set locale to preference, if available. If not, try the main language.
      var preferred = pref.toLowerCase();
      var orig_list = Object.keys( l.data );
      var full_list = orig_list.map( function( e ){ return e.toLowerCase(); } ); // List of available languages
      if ( full_list.indexOf( preferred ) >= 0 ) { // Exact match
         l.setLocale( pref );
      } else {
        preferred = preferred.split( '-' )[0]; // Language match; sorry we are skipping country/locale match for three tier codes.
        var lang_list = full_list.map( function( e ){ return e.split('-')[0]; } );
        if ( lang_list.indexOf( preferred ) >= 0 ) l.setLocale( orig_list[ lang_list.indexOf( preferred ) ] );
      }
   }
   return l.currentLocale;
};

/**
 * Get/set l10n resource on given path
 *
 * @param {string} path Path to get/set resource.
 * @param {*} set  Resource to set.  If null then regarded as get.
 * @param {string} locale Locale to use. NO DEFAULT.
 * @returns {*} if set, return undefined.  If get, return the resource.
 */
_.l.getset = function _l_getset ( locale, path, set ) {
   var p = [ locale ].concat( path.split( '.' ) ), l = _.l;
   var last = p.pop();
   var base = l.data;
   // Explore path
   for ( var i = 0, len = p.length ; i < len ; i++ ) {
      var node = p[i];
      if ( base[node] === undefined )
         if ( set === undefined ) return;
         else base[node] = _.map();
      base = base[node];
   }
   // Set or get data
   if ( set !== undefined ) {
      base[last] = set;
   } else {
      if ( base[last] === undefined && locale !== l.fallbackLocale ) return l.getset( l.fallbackLocale, path, undefined );
      return base[last];
   }
};

/**
 * Set l10n resource on given path
 *
 * @param {string} path Path to set resource
 * @param {*} data Resource to set
 */
_.l.set = function _l_set ( locale, path, data ) {
   if ( arguments.length == 2 ) {
      data = path;
      path = locale;
      locale = _.l.currentLocale;
   }
    _.l.getset( locale, path, data );
    _.l.event.fire( 'set', path, data );
};

/**
 * Localise all child elements with a class name of 'i18n' using its initial textContent or value as resource path.
 *  e.g. <div class='i18n'> gui.frmCalcluate.lblHelp </div>
 *
 * @param {Node=} root Root element to localise, default to whole document
 */
_.l.localise = function _l_localise ( root ) {
   if ( root === undefined ) root = document.documentElement;
   root.setAttribute( 'lang', _.l.currentLocale );
   _.forEach( _( ".i18n" ), function _l_localise_each ( e ) {
      var key = e.getAttribute( "data-i18n" );
      if ( ! key ) {
         switch ( e.tagName ) {
            case 'INPUT':
               key = e.value;
               break;
            case 'MENUITEM':
               key = e.getAttribute( 'label' );
               break;
            default:
               key = e.textContent;
         }
         if ( ! key ) {
            return _.warn( 'i18 class without l10n key: ' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '' ) + ' / ' + e.textContext );
         }
         key = key.trim();
         e.setAttribute( "data-i18n", key );
      }
      var val = _.l( key, key.split('.').pop() );
      switch ( e.tagName ) {
         case 'INPUT':
            e.value = val;
            break;
         case 'MENUITEM':
            e.setAttribute( 'label', val );
            break;
         default:
            e.innerHTML = val;
      }
   });
};

_.l.event = _.EventManager.create( ['set','locale'], _.l );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Testing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Run a test suite and write result to document, or check a specific test.
 *
 * @param {*} condition Either an assertion or a test suite object.
 * @param {string=} name Name of assertion. If absent, condition must be a test suite.
 */
_.test = function _test ( condition, name ) {
   var add = 'appendChild', create = _.create, tr;
   if ( name !== undefined ) {
      // Single test case, append to latest test table
      _.assert( _test.body, '[Addiah] Named test should be called as part of test suit.' );
      var tr = create( 'tr' ), td = create( td );
      if ( condition ) td.textContent = 'OK';
      else td.appendChild( 'b', { class: 'err', text: 'FAIL' } );
      tr[add]( create( 'td', _.escHtml( name ) ) );
      tr[add]( td );
      _test.body[add]( tr );

   } else {
      // Test suite object
      var title = create( 'h1', 'Testing' ), result;
      var success = true;
      document.body[add]( title );
      for ( var test in condition ) {
         if ( ! test.match( /^test/ ) ) continue;
         if ( typeof( condition[test] ) === 'function' ) {

            var table = create( 'table', { class: 'sparrow_test', border: 1 } );
            var cap = create( 'caption', _.escHtml( test ).replace( /^test_+/, '' ) );
            table[add]( cap );
            table[add]( _test.body = create( 'tbody' ) );
            document.body[add]( table );

            // Run test
            try {
               condition[test]();
            } catch ( e ) {
               _test.body[add]( tr = _.create( 'tr' ) );
               tr[add]( _.create( 'td', { colspan:2, class:'err', text: 'Exception during testing: ' + e } ) );
            }

            // Update table caption
            if ( _( table, '.err' ).length ) {
               result = _.create( 'b', 'FAILED: ' );
               success = false;
            } else {
               result = _.create( 'span', 'OK: ' );
            }
            cap.insertBefore( result, cap.firstChild );
         }
      }
      title.textContent = success ? 'Test Success' : 'Test FAILED';
   }
};

_.info('[Sparrow] Sparrow loaded.');
_.time();

return _;

}).call( this );