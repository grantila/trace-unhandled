
Error.stackTraceLimit = 100;

const reStackEntry = /\s+at\s/;

function splitErrorStack( error )
{
	const lines = error.stack.split( "\n" );
	const index = lines.findIndex( line => reStackEntry.test( line ) );
	const message = lines.slice( 0, index ).join( "\n" );
	return { message, lines: lines.slice( index ) };
}

function mergeErrors( traceError, mainError )
{
	const { lines: traceLines } = splitErrorStack( traceError );
	const { lines: errorLines, message } = splitErrorStack( mainError )

	if ( traceLines[ 0 ].includes( "at new TraceablePromise" ) )
	{
		traceLines.shift( );

		const ignore = [
			"at Function.reject (<anonymous>)",
			"at Promise.__proto__.constructor.reject",
		];
		if ( ignore.some( test => traceLines[ 0 ].includes( test ) ) )
			traceLines.shift( );
	}

	traceLines.reverse( );
	errorLines.reverse( );

	var i = 0;
	for ( ;
		i < errorLines.length &&
		i < traceLines.length &&
		errorLines[ i ] === traceLines[ i ];
		++i
	);

	return message +
		"\n    ==== Promise at: ==================\n" +
		traceLines.slice( i ).reverse( ).join( "\n" ) +
		"\n\n    ==== Error at: ====================\n" +
		errorLines.slice( i ).reverse( ).join( "\n" ) +
		"\n\n    ==== Shared trace: ================\n" +
		errorLines.slice( 0, i ).reverse( ).join( "\n" );
}

process.on( "unhandledRejection", ( reason, promise ) =>
{
	const stack =
		promise.__tracedError
		? mergeErrors( promise.__tracedError, reason )
		: reason.stack;

	console.error(
		`(node:${process.pid}) UnhandledPromiseRejectionWarning\n` +
		(
			!promise.__tracedError
			? ""
			: `[ Stacktrace altered by trace-unhandled-rejection ]\n`
		) +
		stack
	);
} );

class TraceablePromise extends Promise
{
	constructor( executor )
	{
		super( wrappedExecutor );

		function wrappedExecutor( ...args )
		{
			return executor( ...args );
		}

		const err = new Error( "Non-failing tracing error" );
		this.__tracedError = err;
	}
}

global.Promise = TraceablePromise;
