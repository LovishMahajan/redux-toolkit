import { describe, it, expect, beforeEach } from "vitest";
import {
	combineReducers,
	configureStore,
	createListenerMiddleware,
} from "@reduxjs/toolkit";
import {
	searchReducer,
	queryChanged,
	searchStarted,
	searchSucceeded,
	searchFailed,
	selectQuery,
} from "..";
import * as searchApi from "../../../services/searchApi";

// Each test builds a fresh store + listener middleware so prior listeners
// don't bleed across tests. Registering the search listener inline lets
// each test inspect timing without sharing module-level state.
function setup() {
	const rootReducer = combineReducers({ search: searchReducer });
	const lm = createListenerMiddleware();
	const store = configureStore({
		reducer: rootReducer,
		middleware: (gdm) => gdm().prepend(lm.middleware),
	});
	const startAppListening = lm.startListening.withTypes<
		ReturnType<typeof rootReducer>,
		typeof store.dispatch
	>();

	startAppListening({
		actionCreator: queryChanged,
		effect: async (action, api) => {
			if (action.payload === "") return;
			api.cancelActiveListeners();
			await api.delay(300);
			const latest = selectQuery(api.getState());
			if (latest === "") return;
			api.dispatch(searchStarted());
			try {
				const hits = await searchApi.search(latest, { signal: api.signal });
				api.dispatch(searchSucceeded(hits));
			} catch (e) {
				if (e instanceof DOMException && e.name === "AbortError") return;
				api.dispatch(searchFailed(e instanceof Error ? e.message : "x"));
			}
		},
	});

	return { store, lm };
}

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("search listener", () => {
	beforeEach(() => searchApi.__resetSearchMock());

	it("debounces: only the last of 5 rapid queries hits the network", async () => {
		const { store } = setup();
		// 5 keystrokes in 50ms. The listener should cancel runs 1-4 and only run 5 should fire.
		store.dispatch(queryChanged("c"));
		store.dispatch(queryChanged("ca"));
		store.dispatch(queryChanged("cat"));
		store.dispatch(queryChanged("cats"));
		store.dispatch(queryChanged("catsy"));
		// Before the debounce window: no API call yet.
		await tick(100);
		expect(searchApi.__getCallCount()).toBe(0);
		// After 300ms debounce: exactly one call should land.
		await tick(400);
		expect(searchApi.__getCallCount()).toBe(1);
		expect(store.getState().search.status).toBe("success");
		expect(store.getState().search.results[0]?.title).toContain("catsy");
	});

	it("reads the LATEST query after the debounce, not the action's payload", async () => {
		const { store } = setup();
		store.dispatch(queryChanged("first"));
		// Wait less than the debounce window
		await tick(200);
		// User types more — this CANCELS the prior listener mid-delay and starts a new one.
		store.dispatch(queryChanged("second"));
		await tick(500);
		expect(store.getState().search.results[0]?.title).toContain("second");
		expect(store.getState().search.results[0]?.title).not.toContain("first");
		expect(searchApi.__getCallCount()).toBe(1);
	});

	it("empty query clears results and does not call the API", async () => {
		const { store } = setup();
		store.dispatch(queryChanged("dog"));
		await tick(500);
		expect(store.getState().search.results.length).toBe(2);
		store.dispatch(queryChanged(""));
		await tick(500);
		expect(store.getState().search.results.length).toBe(0);
		expect(store.getState().search.status).toBe("idle");
		// Still only the first call (the empty query never hit the API).
		expect(searchApi.__getCallCount()).toBe(1);
	});

	it("failed search dispatches searchFailed with the error message", async () => {
		searchApi.__setPretendFail(true);
		const { store } = setup();
		store.dispatch(queryChanged("anything"));
		await tick(500);
		expect(store.getState().search.status).toBe("error");
		expect(store.getState().search.error).toBe("backend down");
	});
});
