
import { loggerUnhandled, logger, getFullyTraceablePromise } from './core';

const { FullyTraceablePromise, unhandled, asyncGraph } = getFullyTraceablePromise( );

process.on( "unhandledRejection", ( reason, promise ) =>
{
	logger( < undefined | Error >reason, promise, process.pid );
} );

process.on( "exit", ( code ) =>
{
	loggerUnhandled( [ ...unhandled ] );

	const roots = new Set< number >( );
	const set = new Set< number >( );
	for ( const [ parentId, node ] of asyncGraph.entries( ) )
	{
		if ( node.isCompleted || node.isDestroyed )
			continue;

		roots.add( parentId );
		set.add( parentId );
		node.childrenAsyncIds.forEach( childId =>
		{
			set.add( childId );
		} );
	}
	console.log("REMAINING ROOTS:", [ ...roots ].sort( ( a, b ) => a - b ) );
	console.log("REMAINING:", [ ...set ].sort( ( a, b ) => a - b ) );

	const unfinished = new Set< number >( );
	for ( const [ asyncId, node ] of asyncGraph )
	{
		const {
			type,
			parentAsyncId,
			lines,
			childrenAsyncIds,
			isChainedPromise,
			isCompleted,
			isDestroyed,
			isResolved,
		} = node;

		if ( isCompleted || isDestroyed || !roots.has( asyncId ) )
			continue;

		console.log(
			`ID: ${asyncId} [${type}] (parent: ${parentAsyncId}) ` +
			`(${!isChainedPromise ? 'non-' : '' }chained)` +
			( isResolved ? ' (resolved)' : '' ) +
			( isCompleted ? ' (completed)' : '' ) +
			( isDestroyed ? ' (destroyed)' : '' ) +
			( roots.has( asyncId ) ? ' (remains itself)' : '' ) +
			( set.has( asyncId ) ? ' (remains deep)' : '' ) +
			( roots.has( parentAsyncId ) ? ' (parent remains itself)' : '' ) +
			( set.has( parentAsyncId ) ? ' (parent remains deep)' : '' ) +
			` (children: ${childrenAsyncIds})`
		);
		unfinished.add( asyncId );
		console.log( `Stack:` );
		lines.forEach( line =>
		{
			console.log( `    ${line}` );
		} )
	}

	for ( const [ asyncId, node ] of asyncGraph )
	{
//		const { type, isDestroyed } = node;
		if ( !unfinished.has( node.parentAsyncId ) )
			continue;

		asyncId;
		if ( node.childrenAsyncIds.length > 0 )
			continue;

//		const tag = isDestroyed ? 'DESTROYED' : 'NOT DESTROYED';

//		console.log( `${asyncId} [${type}] [${tag}] -> ${node.childrenAsyncIds}` );
		console.log(node)
	}
} );

global.Promise = FullyTraceablePromise;
