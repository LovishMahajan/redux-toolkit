import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { searchReducer } from "../features/search";
import { listenerMiddleware } from "./listeners";

const rootReducer = combineReducers({
	search: searchReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
	reducer: rootReducer,
	middleware: (gdm) => gdm().prepend(listenerMiddleware.middleware),
});

export type AppDispatch = typeof store.dispatch;
// Tests build their own store + listener middleware inline (see searchListener.test.ts).
// A shared factory would couple every test to one listener registration set, which
// is exactly what we want to avoid.
