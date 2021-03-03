const { Finally, Try, delay } = require( 'already' );

module.exports.withConsoleSpy = fn => async ( ) =>
{
	const oldError = console.error;
	console.error = jest.fn( );
	return Try( fn )
		.then( ...Finally( ( ) =>
		{
			console.error = oldError;
		} ) );
}

module.exports.triggerUnhandledWarnings =
	async function triggerUnhandledWarnings( )
{
	await delay( 0 );
	global.gc && global.gc( );
	await delay( 0 );
}

module.exports.splitLines = function splitLines( lines )
{
	return [ ].concat( ...lines.map( line => line.split( "\n" ) ) );
}

module.exports.cutColumn = function cutColumn( line )
{
	const m = line.match( /(.*:\d+):\d+\)?$/ );
	if ( !m )
		return line;
	return m[ 1 ];
}

module.exports.cutLocation = function cutLocation( line )
{
	const m = line.match( /(.*):\d+:\d+\)?$/ );
	if ( !m )
		return line;
	return m[ 1 ];
}
