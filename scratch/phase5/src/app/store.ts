import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { explosiveReducer } from "../features/explosive";
import { crashReporter, actionCounter } from "../observability";

const rootReducer = combineReducers({
	explosive: explosiveReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Chain order is intentional:
//   1. actionCounter — records the dispatch attempt unconditionally
//   2. crashReporter — outermost catcher; wraps everything below
// So even if a reducer throws, the counter still recorded the dispatch
// before crashReporter intercepted the failure.
export const store = configureStore({
	reducer: rootReducer,
	middleware: (gdm) => gdm().concat(actionCounter, crashReporter),
});

export type AppDispatch = typeof store.dispatch;

// Factory for tests — fresh store per test.
export function makeStore() {
	return configureStore({
		reducer: rootReducer,
		middleware: (gdm) => gdm().concat(actionCounter, crashReporter),
	});
}
