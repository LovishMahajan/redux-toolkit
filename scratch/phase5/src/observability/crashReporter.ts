import { type Middleware, isAction } from "@reduxjs/toolkit";
import { sink } from "./sink";
import { scrub } from "./scrub";

// Catches throws from `next(action)` — i.e. from any downstream middleware
// OR from the reducer itself. Logs a scrubbed record to the sink, then
// RE-THROWS so dispatch still propagates the failure to the caller.
//
// Place this OUTERMOST in the .concat chain so it catches everything beneath it.
export const crashReporter: Middleware = () => (next) => (action) => {
	try {
		return next(action);
	} catch (e) {
		const type = isAction(action) ? action.type : "<non-action>";
		const payload =
			isAction(action) && "payload" in action ? action.payload : undefined;
		sink.crashes.push({
			action: type,
			payload: scrub(payload), // scrub at the boundary
			message: e instanceof Error ? e.message : String(e),
			stack: e instanceof Error ? (e.stack ?? null) : null,
			ts: new Date().toISOString(),
		});
		throw e; // never silently swallow — let the dispatch caller see it
	}
};
