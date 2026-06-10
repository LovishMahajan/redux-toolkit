import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { weatherReducer, searchReducer } from "../features";
import { crashReporter } from "../observability";

const rootReducer = combineReducers({
	weather: weatherReducer,
	search: searchReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Factory: tests build fresh stores; production code uses the singleton below.
// Both go through the SAME rootReducer + middleware setup, so tests look like prod.
export function makeStore() {
	return configureStore({
		reducer: rootReducer,
		middleware: (gdm) => gdm().concat(crashReporter),
	});
}

export const store = makeStore();

export type AppDispatch = typeof store.dispatch;
