import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { weatherReducer } from "../features/weather";

const rootReducer = combineReducers({
	weather: weatherReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
	reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

// Factory for tests — fresh store per test, no shared state.
export function makeStore() {
	return configureStore({ reducer: rootReducer });
}
