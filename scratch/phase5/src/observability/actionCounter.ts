import { type Middleware, isAction } from "@reduxjs/toolkit";
import { sink } from "./sink";

// Tallies how many times each action type has been dispatched. Demonstrates
// the simplest possible "observe and write to sink" shape. Placed BEFORE
// crashReporter in the chain — the counter still records, then crashReporter
// catches whatever throws.
export const actionCounter: Middleware = () => (next) => (action) => {
	if (isAction(action)) {
		sink.counts.set(action.type, (sink.counts.get(action.type) ?? 0) + 1);
	}
	return next(action);
};
