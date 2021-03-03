
Error.stackTraceLimit = Math.max( 100, Error.stackTraceLimit || 0 );

const reStackEntry = /\s+at\s/;

function splitErrorStack( error?: Error )
{
	if ( !error )
		return { message: "Unknown error", lines: [ ] };

	if ( !error.stack )
		return { message: error.message, lines: [ ] };

	const lines = error.stack.split( "\n" );
	const index = lines.findIndex( line => reStackEntry.test( line ) );
	const message = lines.slice( 0, index ).join( "\n" );
	return { message, lines: lines.slice( index ) };
}

function mergeErrors( traceError: Error, mainError?: Error )
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

export function logger(
	reason: Error | undefined,
	promise: TraceablePromise< any >,
	pid: number | undefined = void 0
)
{
	const stack =
		promise.__tracedError
		? mergeErrors( promise.__tracedError, reason )
		: reason
		? reason.stack
		: "Unknown stack";

	const prefix = pid == null ? '' : `(node:${pid}) `;

	console.error(
		`${prefix}UnhandledPromiseRejectionWarning\n` +
		(
			!promise.__tracedError
			? ""
			: `[ Stacktrace altered by ` +
				`https://github.com/grantila/trace-unhandled ]\n`
		) +
		stack
	);
}

const state: { resolve: any; reject: any; } = { resolve: null, reject: null };

export type PromiseResolver< T > = ( value: T | PromiseLike< T > ) => void;
export type PromiseRejecter = ( reason?: any ) => void;

export type PromiseConstructor< T > =
	( resolve: PromiseResolver< T >, reject: PromiseRejecter ) => void;

export class TraceablePromise< T > extends Promise< T >
{
	public __tracedError?: Error;

	public constructor( executor: PromiseConstructor< T > )
	{
		super( wrappedExecutor );

		function wrappedExecutor(
			resolve: PromiseResolver< T >,
			reject: PromiseRejecter
		)
		{
			state.resolve = resolve;
			state.reject = reject;
		}

		const resolve = state.resolve;
		const reject = state.reject;
		state.resolve = null;
		state.reject = null;

		const err = new Error( "Non-failing tracing error" );
		this.__tracedError = err;

		try
		{
			executor( resolve, reject );
		}
		catch ( err )
		{
			reject( err );
		}
	}
}
