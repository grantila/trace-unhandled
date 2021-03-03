import { createHook, executionAsyncId, triggerAsyncId, AsyncResource } from 'async_hooks'
import { Finally } from 'already'

import { writeSync } from 'fs'

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

function filterLines( lines: Array< string > )
{
	const ret = [ ...lines ];

	if ( ret.length > 0 && ret[ 0 ].includes( "at new TraceablePromise" ) )
	{
		ret.shift( );

		const ignore = [
			"at new FullyTraceablePromise",
			"at Function.reject (<anonymous>)",
			"at Promise.__proto__.constructor.reject",
		];
		while ( ignore.some( test => ret[ 0 ].includes( test ) ) )
			ret.shift( );
	}

	return ret;
}

const stronglyFilteredLines = [
	'trace-unhandled/dist/lib/core.js',
	' (internal/',
	'at internal/main/run_main_module.js',
];

function filterLinesStrong( lines: Array< string > )
{
	return lines.filter( line =>
		!stronglyFilteredLines.some( test => line.includes( test ) )
	);
}

function mergeErrors( traceError: Error, mainError?: Error )
{
	const { lines: rawTraceLines } = splitErrorStack( traceError );
	const { lines: errorLines, message } = splitErrorStack( mainError )

	const traceLines = filterLines( rawTraceLines );

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
			: `[ Stacktrace altered by https://github.com/grantila/trace-unhandled ]\n`
		) +
		stack
	);
}

function formatStack( err?: Error )
{
	let ret = "";

	const { lines } = splitErrorStack( err );
	ret += filterLines( lines ).join( '\n' );

	return ret;
}

function formatUnhandledPromise( promise: TraceablePromise< any > )
{
	let ret = "";

	ret += 'BEGIN ---------\n';
	ret += `Promise with executionAsyncId=${(promise as any).executionAsyncId}, triggerAsyncId=${(promise as any).triggerAsyncId}\n`;
	const { message, lines } = splitErrorStack( promise.__tracedError );
	ret += message + '\n';
	ret += filterLines( lines ).join( '\n' ) + '\n';
	ret += 'END -----------\n';

	return ret;
}

export function loggerUnhandled( promises: Array< TraceablePromise< any > > )
{
	// logger( < undefined | Error >reason, promise, process.pid );
	if ( promises.length > 0 )
		console.error( "Unhandled promises (neither resolved nor rejected):" );

	for ( const promise of promises )
	{
		console.error( formatUnhandledPromise( promise ) );
	}

	// const stack =
	// 	promise.__tracedError
	// 	? mergeErrors( promise.__tracedError, reason )
	// 	: reason
	// 	? reason.stack
	// 	: "Unknown stack";

	// const prefix = pid == null ? '' : `(node:${pid}) `;

	// console.error(
	// 	`${prefix}UnhandledPromiseRejectionWarning\n` +
	// 	(
	// 		!promise.__tracedError
	// 		? ""
	// 		: `[ Stacktrace altered by https://github.com/grantila/trace-unhandled ]\n`
	// 	) +
	// 	stack
	// );
}

export type PromiseResolver< T > = ( value?: T | PromiseLike< T > ) => void;
export type PromiseRejecter = ( reason?: any ) => void;

export type PromiseConstructor< T > =
	( resolve: PromiseResolver< T >, reject: PromiseRejecter ) => void;

type FulfilledArg< T, TResult > =
	( ( value: T ) => TResult | PromiseLike< TResult > ) | undefined | null;
type RejectedArg< T > =
	( (reason: any ) => T | PromiseLike< T >) | undefined | null;


export interface State
{
	resolve: PromiseResolver< any >;
	reject: PromiseRejecter;
}

const traceableState: State = { resolve: null as any, reject: null as any };
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
			traceableState.resolve = resolve;
			traceableState.reject = reject;
		}

		const resolve = traceableState.resolve;
		const reject = traceableState.reject;
		traceableState.resolve = null as any;
		traceableState.reject = null as any;

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

function debuglog(...args: any[])
{
	const msg = args.map( val =>
		typeof val === 'string' ||
		typeof val === 'undefined' ||
		typeof val === 'number' ||
		typeof val === 'boolean' ||
		typeof val === 'bigint' ||
		val === null
		? val
		: val.toString( ) === '[object Arguments]'
		? [ ...val ]
		: ( val.toString( ) + "=" + JSON.stringify( val, null, 4 ) )
	)
	.join( ' ' )
	writeSync(1, msg + "\n")
	// const stack = ( new Error( ) ).stack;
	// writeSync(1, stack + "\n====\n")
}

function noop( ) { }

interface PromiseWrap
{
	isChainedPromise: boolean;
}

interface GraphNode
{
	type: string;
	parentAsyncId: number;
	childrenAsyncIds: Array< number >;
	lines: Array< string >;
	isChainedPromise: boolean;
	isCompleted: boolean;
	isDestroyed: boolean;
	isResolved: boolean;
}

export interface FullyTraceablePromiseResult
{
	FullyTraceablePromise: typeof TraceablePromise;
	unhandled: Set< TraceablePromise< unknown > >;
	asyncGraph: Map< number, GraphNode >;
}

export function getFullyTraceablePromise( ): FullyTraceablePromiseResult
{
	const asyncGraph = new Map< number, GraphNode >( );

	function addChild(
		parentId: number,
		childId: number,
		{ type, lines, isChainedPromise }:
			Pick< GraphNode, 'type' | 'lines' | 'isChainedPromise' >
	)
	{
		let node = asyncGraph.get( childId );
		if ( node == null )
		{
			node = {
				type,
				childrenAsyncIds: [ ],
				parentAsyncId: parentId,
				lines,
				isChainedPromise,
				isCompleted: false,
				isDestroyed: false,
				isResolved: false,
			};
			asyncGraph.set( childId, node );
		}

		const parent = asyncGraph.get( parentId );
		if ( parent )
			parent.childrenAsyncIds.push( childId );
	}

	function tryDecorateGraphNode(
		asyncId: number,
		merge: Partial< GraphNode >
	)
	{
		const node = asyncGraph.get( asyncId );
		if ( !node )
			return;
		Object.assign( node, merge );
	}

	const old = AsyncResource.prototype.constructor;
	AsyncResource.prototype.constructor = function CTOR( a: any, b: any )
	{
		debuglog("ASYNC RESOURCE")
		return old( a, b );
	};

	createHook( {
		before( asyncId )
		{
			debuglog( `hook::before: asyncId=${asyncId}` );
		},
		after( asyncId )
		{
			debuglog( `hook::after: asyncId=${asyncId}` );
			tryDecorateGraphNode( asyncId, { isCompleted: true } );
		},
		init: function( asyncId, type, triggerAsyncId, obj )
		{
			debuglog( `hook::init [${type}]: asyncId=${asyncId}, triggerAsyncId=${triggerAsyncId}, obj=${obj}` );
//			debuglog("INIT ", arguments);

			let isChainedPromise = false;
			const { lines: RawLines } = splitErrorStack( new Error( ) );
			const lines = filterLinesStrong( RawLines );

			if ( type === 'FSREQPROMISE' )
			{
				const err = new Error( "Non-failing tracing error" );
				const promise =
					( obj as any ).promise as FullyTraceablePromise< unknown >;
				// unhandled.add( promise );
				promise.__tracedError = err;
				promise.executionAsyncId = asyncId;
				promise.triggerAsyncId = triggerAsyncId;

				debuglog(JSON.stringify(obj, null, 4));
				console.log(promise);
				console.log(promise.constructor);
				console.log(promise.__tracedError);
				console.log(promise.executionAsyncId);
				console.log(promise.triggerAsyncId);
//				process.exit(0)
			}
			if (type === 'PROMISE')
			{
				( obj as any ).promise.then = then;
				( obj as any ).promise.catch = _catch;
				( obj as any ).promise.finally = _finally;
				isChainedPromise = ( obj as PromiseWrap ).isChainedPromise;

// 				debuglog(`  => ${JSON.stringify(obj, null, 4)}`);
// //				isChainedPromise
// 				debuglog(`  FROM >: ${formatStack(new Error())}`);
			}

			addChild( triggerAsyncId, asyncId, {
				type,
				lines,
				isChainedPromise,
			} );
		},
		destroy( asyncId )
		{
			debuglog( `hook::destroy: asyncId=${asyncId}` );
			tryDecorateGraphNode( asyncId, { isDestroyed: true } );
		},
		promiseResolve( asyncId )
		{
			debuglog( `hook::resolve: asyncId=${asyncId}` );
			tryDecorateGraphNode( asyncId, { isResolved: true } );
		}
	} )
	.enable( );
	eval('async function dummyx( ) { }')
	async function dummy( ) { }
	dummy( );

	const unhandled = new Set< FullyTraceablePromise< unknown > >( );
	const fullyTraceableState: State = {
		resolve: null as any,
		reject: null as any,
	};

	const origThen = Promise.prototype.then;
	const origCatch = Promise.prototype.catch;
	const origFinally = Promise.prototype.finally;

	function then< T, TResult1 = T, TResult2 = never >(
		this: FullyTraceablePromise< T >,
		onFulfilled?: FulfilledArg< T, TResult1 >,
		onRejected?: RejectedArg< TResult2 >
	)
	: Promise< TResult1 | TResult2 >
	{
		debuglog(`then: executionAsyncId=${executionAsyncId()} triggerAsyncId=${triggerAsyncId()}`);
		debuglog(`  FROM >: ${formatStack(new Error())}`);
		debuglog(`    ON >: ${formatUnhandledPromise(this)}`);
		unhandled.delete( this );
		return origThen.call( this, onFulfilled, onRejected ) as Promise< TResult1 | TResult2 >;
	}

	function _catch< T, TResult = never >(
		this: FullyTraceablePromise< T >,
		onRejected?: RejectedArg< TResult >
	)
	: Promise< T | TResult >
	{
		debuglog(`catch: executionAsyncId=${executionAsyncId()} triggerAsyncId=${triggerAsyncId()}`);
		unhandled.delete( this );
		return origCatch.call( this, onRejected ) as Promise< T | TResult >;
	}

	function _finally< T >(
		this: FullyTraceablePromise< T >,
		onFinally?: ( ( ) => void ) | undefined | null
	)
	: Promise< T >
	{
		debuglog(`finally: executionAsyncId=${executionAsyncId()} triggerAsyncId=${triggerAsyncId()}`);
		unhandled.delete( this );

		if ( !!origFinally )
		{
			return origFinally.call( this, onFinally ) as Promise< T >;
		}
		else
		{
			const cb = onFinally || noop;
			return then.call( this, ...Finally( cb ) ) as Promise< T >;
		}
	}

	const OrigPromise = Promise;

	Promise.resolve = function< T >( t: T | PromiseLike< T > ): Promise< T >
	{
		debuglog(`resolve: executionAsyncId=${executionAsyncId()} triggerAsyncId=${triggerAsyncId()}`);
		if ( t instanceof OrigPromise )
			return t;
		return new Promise( resolve => resolve( t ) );
	} as typeof Promise.resolve;

	Promise.prototype.then = then;
	Promise.prototype.catch = _catch;
	Promise.prototype.finally = _finally;

	class FullyTraceablePromise< T > extends TraceablePromise< T >
	{
		public executionAsyncId: number;
		public triggerAsyncId: number;

		public constructor( executor: PromiseConstructor< T > )
		{
			super( wrappedExecutor );

			function wrappedExecutor(
				resolve: PromiseResolver< T >,
				reject: PromiseRejecter
			)
			{
				fullyTraceableState.resolve = resolve;
				fullyTraceableState.reject = reject;
			}

			const resolve = fullyTraceableState.resolve;
			const reject = fullyTraceableState.reject;
			fullyTraceableState.resolve = null as any;
			fullyTraceableState.reject = null as any;

			unhandled.add( this );

			//const realThen = this.then;
			// const realCatch = this.catch;
			// const realFinally = this.finally;

			this.executionAsyncId = executionAsyncId( );
			this.triggerAsyncId = triggerAsyncId( );

			debuglog(`Promise: executionAsyncId=${this.executionAsyncId} triggerAsyncId=${this.triggerAsyncId}`);
			const { lines: RawLines } = splitErrorStack( new Error( ) );
			const lines = filterLinesStrong( RawLines )
			debuglog(`  STACK:`);
			lines.forEach( line =>
			{
				debuglog( '    ' + line );
			} );

			// this.then = ( ( ...args: any[ ] ) =>
			// {
			// 	debuglog(`then: executionAsyncId=${executionAsyncId()} triggerAsyncId=${triggerAsyncId()}`);
            //     debuglog(`then: ${new Error().stack}`);
			// 	unhandled.delete( this );
			// 	return realThen.call( this, ...args );
			// } ) as Promise< T >[ 'then' ];
			// this.catch = ( ( ...args: any[ ] ) =>
			// {
			// 	unhandled.delete( this );
			// 	return realCatch.call( this, ...args );
			// } ) as Promise< T >[ 'catch' ];
			// if ( this.finally )
			// 	this.finally = ( ( ...args: any[ ] ) =>
			// 	{
			// 		unhandled.delete( this );
			// 		return realFinally.call( this, ...args );
			// 	} ) as Promise< T >[ 'finally' ];

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

	Promise.prototype.constructor = FullyTraceablePromise.prototype.constructor;
	Object.defineProperty( Promise, Symbol.species, { value: FullyTraceablePromise } );

	console.log(Object.getOwnPropertyDescriptors(Promise))
	console.log(Object.getOwnPropertyDescriptors(Promise.prototype))
	console.log(Promise[Symbol.species])

	const AsyncFunction = Object.getPrototypeOf( async function( ){ } ).constructor;
	const AsyncFunctionPrototype = AsyncFunction.prototype;
	const origAsyncFunctionApply = AsyncFunctionPrototype.apply;
	const origAsyncFunctionCall = AsyncFunctionPrototype.call;

	console.log(Object.getOwnPropertyDescriptors(AsyncFunctionPrototype))

	function TraceableAsyncFunction( )
	{
		debuglog("CTOR" + JSON.stringify(arguments, null, 4));
		debuglog(`  FROM >: ${formatStack(new Error())}`);
		return AsyncFunction( ...arguments );
	};
	Object.defineProperty( AsyncFunctionPrototype, 'constructor', { value: TraceableAsyncFunction } );
	debuglog('AA')
	AsyncFunctionPrototype.apply = function TraceableApply( )
	{
		debuglog("APPLY" + JSON.stringify(arguments, null, 4));
		debuglog(`  FROM >: ${formatStack(new Error())}`);
		return origAsyncFunctionApply( this, ...arguments );
	};
	debuglog('BB')
	AsyncFunctionPrototype.call = function TraceableCall( )
	{
		debuglog("CALL" + JSON.stringify(arguments, null, 4));
		debuglog(`  FROM >: ${formatStack(new Error())}`);
		return origAsyncFunctionCall( this, ...arguments );
	};
	debuglog('CC')

	console.log( Object.getOwnPropertyDescriptors(AsyncFunctionPrototype) )
	console.log( Object.getOwnPropertyDescriptors(AsyncFunction) )
	debuglog('DD')

	function foo() {
		const x = new AsyncFunction('a', 'return await a;')
		const y = x(4)
		debuglog('VALUE RETURNED: ' + y)
		y.then((val: any) => {
			debuglog('RESOLVED VALUE RETURNED: ' + val)
		})
		eval(`
		async function g() {}
		g();
		`)
	}
	debuglog('EE\n')
	foo()
	debuglog('FF\n')

	//class FullyTraceablePromise< T > extends TraceablePromise< T >

	return { FullyTraceablePromise, unhandled, asyncGraph }
}
