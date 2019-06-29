
const { Finally, Try, delay } = require( 'already' );
require( './register' );

const withConsoleSpy = fn => async ( ) =>
{
	const oldError = console.error;
	console.error = jest.fn( );
	return Try( fn )
		.then( ...Finally( ( ) =>
		{
			console.error = oldError;
		} ) );
}

async function triggerUnhandledWarnings( )
{
	await delay( 0 );
	global.gc && global.gc( );
	await delay( 0 );
}

function splitLines( lines )
{
	return [ ].concat( ...lines.map( line => line.split( "\n" ) ) );
}

function cutColumn( line )
{
	const m = line.match( /(.*:\d+):\d+\)?$/ );
	if ( !m )
		return line;
	return m[ 1 ];
}

function cutLocation( line )
{
	const m = line.match( /(.*):\d+:\d+\)?$/ );
	if ( !m )
		return line;
	return m[ 1 ];
}

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
} );
