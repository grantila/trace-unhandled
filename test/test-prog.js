const { executionAsyncId, triggerAsyncId } = require( 'async_hooks' );

const { readdir } = require( 'fs' ).promises;

const { delay } = require( 'already' );
require( '../register-full' );

async function a( )
{
	await delay( 1 );
}

async function b( )
{
	await a( );
}

async function c( )
{
//	b( );
	await b( );
}

async function fs( )
{
	return readdir( "/tmp" );
}

async function noop( )
{
	console.log(`IN NOOP executionAsyncId=${executionAsyncId()}, triggerAsyncId=${triggerAsyncId()}`)
}

c( ).then( async ( ) =>
{
	console.log(`IN THEN executionAsyncId=${executionAsyncId()}, triggerAsyncId=${triggerAsyncId()}`)
	await noop( );
	await b( ); // const pb = b( ); await pb;
	await noop( );
	b( );
	new Promise( ( resolve ) =>
	{
		const timer = setTimeout( resolve, 500 );
		timer.unref( );
	} );
	// b( );
//	process.exit(0)
} )
.then( ( ) =>
{
	function doesntexist( ) { }

	new Promise( resolve => resolve( ) ).then( ( ) =>
	{
		a( );
	} )
	.then( doesntexist );

	fs( );

	console.log(`IN NEXT THEN executionAsyncId=${executionAsyncId()}, triggerAsyncId=${triggerAsyncId()}`)
	// process.exit(0)
} );
