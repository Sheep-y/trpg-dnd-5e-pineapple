/*                                                                                                                      <![CDATA[ ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab *//**
 * polyfill_es7.js
 *
 * Polyfill for ES7 features.  Requires ES5.1 support.
 */
( function es7_polyfill ( ns ) { 'use strict';

if ( ! [].includes ) {
   Object.defineProperty( Array.prototype, 'includes', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function Array_includes ( target, fromIndex ) {
         var me = Object( this ), len = parseInt( me.length ) || 0;
         if ( len <= 0 ) return false;
         var n = parseInt( fromIndex ) || 0;
         if ( n < 0 ) n = Math.max( 0, n + len );
         while ( n < len ) if ( Object.is( target, me[ n++ ] ) ) return true;
         return false;
      }
   } );
}

})();/*]]>*/