// Phase 1 — the smallest possible RTK store.
// Just configureStore with no reducers. Verifies the toolchain works.

import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
	reducer: {}, // intentionally empty — we'll add slices in Phase 2
});

// The two types every RTK app exports. You'll re-derive these in every project.
//   RootState   = the shape of getState()
//   AppDispatch = the type of dispatch (knows about thunks once we add them)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Smoke test — proves the store boots and getState() returns {}.
// Delete this in Phase 2 when we add real slices.
console.log("store ready, initial state:", store.getState());
