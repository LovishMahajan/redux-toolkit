// src/features/cart/cartSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLine, CartState } from "./types";
import type { RootState } from "../../app";
import { userLoggedOut } from "../auth";

const initialState: CartState = { lines: [] };

const cartSlice = createSlice({
	name: "cart",
	initialState,
	reducers: {
		itemAddedToCart: {
			// The reducer mutates the Immer draft — safe, produces new immutable state.
			reducer(state, action: PayloadAction<CartLine>) {
				const existing = state.lines.find(
					(l) => l.productId === action.payload.productId,
				);
				if (existing) existing.quantity += action.payload.quantity;
				else state.lines.push(action.payload);
			},
			// prepare: normalize/validate the payload before it hits the reducer.
			// Here: default quantity to 1 so callers don't repeat themselves.
			prepare(input: {
				productId: string;
				name: string;
				unitPriceCents: number;
				quantity?: number;
			}) {
				return {
					payload: {
						productId: input.productId,
						name: input.name,
						unitPriceCents: input.unitPriceCents,
						quantity: input.quantity ?? 1,
					} satisfies CartLine,
				};
			},
		},
		itemRemovedFromCart(
			state,
			action: PayloadAction<{ productId: string }>,
		) {
			state.lines = state.lines.filter(
				(l) => l.productId !== action.payload.productId,
			);
		},
		cartCleared(state) {
			state.lines = [];
		},
	},
	extraReducers: (builder) => {
		builder.addCase(userLoggedOut, () => ({ lines: [] }));
	},
});

export const { itemAddedToCart, itemRemovedFromCart, cartCleared } =
	cartSlice.actions;
export default cartSlice.reducer;

// DERIVED data lives in selectors, never in state. (Phase 3 makes these memoized.)
export const selectCartLines = (s: RootState) => s.cart.lines;
export const selectCartItemCount = (s: RootState) =>
	s.cart.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartSubtotalCents = (s: RootState) =>
	s.cart.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
