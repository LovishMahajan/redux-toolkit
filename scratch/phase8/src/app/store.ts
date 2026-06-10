import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { api } from "./api";

// IMPORT the feature api modules so their injectEndpoints side effects fire.
// Without these imports, calling `usersApi.endpoints.getUsers` works at the
// type level but `initiate()` would return "unknown endpoint" at runtime.
import "../features/users/usersApi";
import "../features/books/booksApi";

const rootReducer = combineReducers({
	// (1) Register the cache reducer at api.reducerPath ("api").
	[api.reducerPath]: api.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore() {
	return configureStore({
		reducer: rootReducer,
		// (2) Register api.middleware — without it, queries don't fire.
		middleware: (gdm) => gdm().concat(api.middleware),
	});
}

export const store = makeStore();
export type AppDispatch = typeof store.dispatch;
