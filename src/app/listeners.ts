// src/app/listeners.ts
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./store";
import {
	itemAddedToCart,
	itemRemovedFromCart,
	cartCleared,
	selectCartLines,
} from "../features/cart";
import { loginUser } from "../features/auth";
import { cartApi } from "../services";

export const listenerMiddleware = createListenerMiddleware();
const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch
>();

// 1) DEBOUNCED persist-on-change. cancelActiveListeners() = takeLatest: only the newest run survives.
startAppListening({
	matcher: isAnyOf(itemAddedToCart, itemRemovedFromCart, cartCleared),
	effect: async (_action, api) => {
		api.cancelActiveListeners(); // cancel any earlier run still waiting in its delay
		await api.delay(500); // debounce window
		// Re-read state AFTER the debounce: the user may have logged out in the meantime,
		// which wipes the cart (extraReducer on userLoggedOut). Don't persist for a session
		// that no longer exists — persistCart([]) would 400 with "Cart is empty".
		const state = api.getState();
		if (state.auth.status !== "authenticated") return;
		await cartApi.persistCart(selectCartLines(state));
	},
});

// 2) BACKOFF RETRY on a transient failure — a recovery strategy.
startAppListening({
	actionCreator: loginUser.rejected,
	effect: async (action, api) => {
		if (action.payload?.code !== "network") return; // only retry transient; never retry bad creds
		for (let attempt = 1; attempt <= 3; attempt++) {
			await api.delay(2 ** attempt * 200); // 400ms, 800ms, 1600ms exponential backoff
			const ok = await api
				.dispatch(loginUser(action.meta.arg))
				.unwrap()
				.then(
					() => true,
					() => false,
				);
			if (ok) return;
		}
	},
});
