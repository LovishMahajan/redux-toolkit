import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./store";
import {
	queryChanged,
	searchStarted,
	searchSucceeded,
	searchFailed,
	selectQuery,
} from "../features/search";
import * as searchApi from "../services/searchApi";

export const listenerMiddleware = createListenerMiddleware();
const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch
>();

// Search-as-you-type with debounce + takeLatest semantics.
//
// Pattern:
//   1. cancelActiveListeners()  → kills any prior in-flight run (takeLatest)
//   2. delay(300)               → debounce window; cancelled runs throw here
//   3. re-read state            → the query may have changed; use the LATEST
//   4. dispatch start           → reducer transitions to loading
//   5. fetch with api.signal    → the network call itself is cancellable
//   6. dispatch success/fail    → reducer writes results
startAppListening({
	actionCreator: queryChanged,
	effect: async (action, api) => {
		// Empty query: no fetch (the reducer already cleared results synchronously).
		if (action.payload === "") return;

		api.cancelActiveListeners();
		await api.delay(300);

		// Re-read AFTER the debounce. The user may have typed more characters
		// (but those would have cancelled us); if we're still alive, this is
		// the most recent query.
		const latestQuery = selectQuery(api.getState());
		if (latestQuery === "") return; // user cleared mid-debounce

		api.dispatch(searchStarted());
		try {
			const hits = await searchApi.search(latestQuery, { signal: api.signal });
			api.dispatch(searchSucceeded(hits));
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return; // cancelled — drop
			api.dispatch(searchFailed(e instanceof Error ? e.message : "Unknown"));
		}
	},
});
