
import { logger, TraceablePromise, setLogger} from "../lib/core";

window.onunhandledrejection = function( event: PromiseRejectionEvent )
{
	logger( event.reason, event.promise );
};

( < any >window ).Promise = TraceablePromise;
( < any >window ).setTraceUnhandledLogger = setLogger;
