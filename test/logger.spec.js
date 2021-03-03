
const index = require( '../dist/index' );
const {
	triggerUnhandledWarnings,
	splitLines,
	cutColumn,
} = require( './helpers' );


describe( "logger", ( ) =>
{
	it( "setLogger", async ( ) =>
	{
		const logger = jest.fn( );
		index.setLogger( logger );
		index.register( );

		const err = new Error( "foobar" );

		new Promise( ( resolve, reject ) =>
		{
			throw err;
		} );

		await triggerUnhandledWarnings( );

		index.setLogger( );

		const linesWoColumns = splitLines( logger.mock.calls[ 0 ] )
			.filter( line => line.includes( "logger.spec.js" ) )
			.map( line => cutColumn( line ) );

		const errorAndShared = splitLines( logger.mock.calls[ 0 ] )
			.filter( line => line );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( errorAndShared )
			.toContain( "    ==== Error at: ====================" );
			expect( errorAndShared )
			.toContain( "    ==== Shared trace: ================" );
	} );
} );
