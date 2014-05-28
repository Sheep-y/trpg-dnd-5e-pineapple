// ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab

var p = new _.parser();

p.addRule( 'ternary' ).next().when( '?' ).same().one( ':' ).same();

p.addRule( 'compare' ).next().when( [ '>', '<', '=', '>=', '<=', '==' ] ).next();

p.addRule( 'addminus' )
   .next().save( 'left' )
   .when( [ '+', '-' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'multiply' )
   .next().save( 'left' )
   .when( [ '*', '/' ] ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'unary1' )
   .when( [ '!', '-', '#' ] ).save( 'op' )
      .same().save( 'right' )
      .end()
   .else().next();

p.addRule( 'unary2' )
   .next().save( 'left' )
   .when( '[' ).save( 'op' )
      .top().save( 'right' )
      .end( ']' );

p.addRule( 'dot' )
   .next().save( 'left' )
      .when( '.' ).save( 'op' )
      .same().save( 'right' );

p.addRule( 'bracket' )
   .when( '(' ).save( 'op' )
      .top().save( 'right' )
      .end( ')' )
   .else().next();

p.addRule( 'array' )
   .when( '[' ).any( '{top}', ',' ).save( 'array' ).end( ']' )
   .else().next();

p.addRule( 'function' )
   .next().save( 'name' )
//   .ifwas( /\w+/ )
   .when( '(' ).any( '{top}', ',' ).save( 'param' ).end( ')' );
/**/
p.addRule( 'value' )
//   .onparse( function(e){ _.log(e); return e+"'"; } )
   .when( /\d+/ ).save().end()
   .else().when( /\w+/ ).save().end()
          .else().one( /lit/ ).save();

_.log( p.parse( 'a.b[ c ] * -2 - 3 ' ) );
_.log( p.parse( '[1][0]' ) );
_.log( p.parse( 'floor( ( y.s - 10 ) / 2 )' ) );