
const {
	withConsoleSpy,
	triggerUnhandledWarnings,
	splitLines,
	cutColumn,
	cutLocation,
} = require( './helpers' );

require( '../register' );


describe( "register", ( ) =>
{
	it( "Handle simplest case (same location)", withConsoleSpy( async ( ) =>
	{
		Promise.reject( new Error( "the error" ) );

		await triggerUnhandledWarnings( );

		const lines = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		expect( lines.length ).toBeGreaterThanOrEqual( 2 );
		expect( lines[ 0 ] ).toBe( lines[ 1 ] );
	} ) );

	it( "Handle async case <reject()> (different locations)", withConsoleSpy( async ( ) =>
	{
		const err = new Error( "the error" );

		Promise.reject( err );

		await triggerUnhandledWarnings( );

		const linesWoColumns = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		const linesWoLocation = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutLocation( line ) );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( linesWoLocation.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoLocation[ 0 ] ).toBe( linesWoLocation[ 1 ] );
	} ) );

	it( "Handle async case <new Promise> (different locations)", withConsoleSpy( async ( ) =>
	{
		const err = new Error( "the error" );

		new Promise( ( resolve, reject ) =>
		{
			reject( err );
		} );

		await triggerUnhandledWarnings( );

		const linesWoColumns = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		const linesWoLocation = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutLocation( line ) );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( linesWoLocation.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoLocation[ 0 ] ).toBe( linesWoLocation[ 1 ] );
	} ) );

	it( "Handle throwing in <new Promise>", withConsoleSpy( async ( ) =>
	{
		const err = new Error( "the error" );

		new Promise( ( resolve, reject ) =>
		{
			throw err;
		} );

		await triggerUnhandledWarnings( );

		const linesWoColumns = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		const linesWoLocation = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutLocation( line ) );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( linesWoLocation.length ).toBeGreaterThanOrEqual( 2 );
		expect( linesWoLocation[ 0 ] ).toBe( linesWoLocation[ 1 ] );
	} ) );

	it( "Handle error without stack", withConsoleSpy( async ( ) =>
	{
		const err = new Error( "the error" );
		delete err.stack;

		new Promise( ( resolve, reject ) =>
		{
			throw err;
		} );

		await triggerUnhandledWarnings( );

		const linesWoColumns = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		const errorAndShared = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 1 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( errorAndShared[ errorAndShared.length - 2 ] ).toBe(
			"    ==== Error at: ===================="
		);
		expect( errorAndShared[ errorAndShared.length - 1 ] ).toBe(
			"    ==== Shared trace: ================"
		);
	} ) );

	it( "Handle null error", withConsoleSpy( async ( ) =>
	{
		const err = null;

		new Promise( ( resolve, reject ) =>
		{
			throw err;
		} );

		await triggerUnhandledWarnings( );

		const linesWoColumns = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line.includes( "register.spec.js" ) )
			.map( line => cutColumn( line ) );

		const errorAndShared = splitLines( console.error.mock.calls[ 0 ] )
			.filter( line => line );

		expect( linesWoColumns.length ).toBeGreaterThanOrEqual( 1 );
		expect( linesWoColumns[ 0 ] ).not.toBe( linesWoColumns[ 1 ] );

		expect( errorAndShared[ errorAndShared.length - 2 ] ).toBe(
			"    ==== Error at: ===================="
		);
		expect( errorAndShared[ errorAndShared.length - 1 ] ).toBe(
			"    ==== Shared trace: ================"
		);
	} ) );
} );
