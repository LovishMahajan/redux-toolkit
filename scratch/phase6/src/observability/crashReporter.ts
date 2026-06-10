import { type Middleware, isAction } from "@reduxjs/toolkit";
import { sink } from "./sink";

export const crashReporter: Middleware = () => (next) => (action) => {
	try {
		return next(action);
	} catch (e) {
		sink.crashes.push({
			action: isAction(action) ? action.type : "<non-action>",
			message: e instanceof Error ? e.message : String(e),
			ts: new Date().toISOString(),
		});
		throw e;
	}
};
