import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { counterReducer } from "../features/counter";
import { themeReducer } from "../features/theme";

// Extracted so RootState doesn't depend on the store value.
// (See Phase 2 notes — breaks the store → middleware → RootState → store cycle.)
const rootReducer = combineReducers({
	counter: counterReducer,
	theme: themeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
	reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;
