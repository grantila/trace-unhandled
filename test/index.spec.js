
const index = require( '../dist/index' );

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
		jest.doMock( '../dist/lib/register.js', spy );
		index.register( );
		expect( spy.mock.calls.length ).toBe( 1 );
		jest.dontMock( '../dist/lib/register.js' );
	} );
} );
