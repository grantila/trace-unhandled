
import { logger, TraceablePromise } from './core';

process.on( "unhandledRejection", ( reason, promise ) =>
{
	logger( < undefined | Error >reason, promise, process.pid );
} );

global.Promise = TraceablePromise;
