import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { postsReducer } from "../features/posts";

const rootReducer = combineReducers({
	posts: postsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore() {
	return configureStore({
		reducer: rootReducer,
		// SCOPE the dev-only serializable check away from the huge posts slice.
		// Disabling outright would hide real bugs; scoping is the LTS-correct move.
		middleware: (gdm) =>
			gdm({
				serializableCheck: { ignoredPaths: ["posts"] },
				immutableCheck: { ignoredPaths: ["posts"] },
			}),
	});
}

export const store = makeStore();
export type AppDispatch = typeof store.dispatch;
