
import { logger, TraceablePromise } from "../lib/core";

window.onunhandledrejection = function( event: PromiseRejectionEvent )
{
	logger( event.reason, event.promise );
};

( < any >window ).Promise = TraceablePromise;
