// src/app/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import { listenerMiddleware } from "./listeners";
import { analyticsMiddleware } from "../observability/analyticsMiddleware";
import { auditMiddleware } from "../observability/auditMiddleware";
import { timingMiddleware } from "../observability/timingMiddleware";

// Build the root reducer separately so RootState can be derived from it
// WITHOUT depending on `store`. This breaks the cycle:
//   store → auditMiddleware → RootState → store
const rootReducer = combineReducers({
	auth: authReducer,
	cart: cartReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
	reducer: rootReducer,
	// thunk + devtools + (dev) serializableCheck + immutableCheck are already on.
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
		  // The RIGHT way to handle a serializableCheck complaint: SCOPE it, don't kill it.
		  serializableCheck: {
			ignoredActions: [],          // e.g. an action whose meta legitimately carries an AbortController
			ignoredPaths: [],            // e.g. a state path holding an intentionally non-serializable handle
		  },
		  // immutableCheck is dev-only and O(state size); on huge state you can scope it,
		  // but disabling it to silence a "mutation detected" error hides a real bug.
		})
		  .prepend(listenerMiddleware.middleware)             // runs first — sees raw actions
		  .concat(timingMiddleware, analyticsMiddleware, auditMiddleware), // after thunk — plain actions only
});

export type AppDispatch = typeof store.dispatch;
