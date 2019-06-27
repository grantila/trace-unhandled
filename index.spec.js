
const index = require( './' );

describe( "register", ( ) =>
{
	it( "should export 'register'", ( ) =>
	{
		expect( index ).toMatchObject( {
			register: expect.any( Function ),
		} );
	} );

	it( "should load 'register'", ( ) =>
	{
		const spy = jest.fn( );
		jest.doMock( './register.js', spy );
		index.register( );
		expect( spy.mock.calls.length ).toBe( 1 );
		jest.dontMock( './register.js' );
	} );
} );
