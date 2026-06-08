// src/features/catalog/catalogSlice.ts
import {
	createEntityAdapter,
	createSelector,
	createSlice,
	type EntityState,
	type PayloadAction,
} from "@reduxjs/toolkit";
import type { Product } from "./types";
import type { RootState } from "../../app/store";

const MAX_PRODUCTS = 500; // working-set cap — the slice holds only the active window

const adapter = createEntityAdapter<Product>({
	// adapter keeps ids[] ordered by this comparer on every insert/upsert
	sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Bounded-store guarantee: keep the hot working set, drop the coldest by updatedAt.
// ISO-8601 strings sort lexicographically in chronological order, so localeCompare on
// updatedAt is equivalent to comparing timestamps.
function evictToCapByAge(state: EntityState<Product, string>) {
	const overflow = state.ids.length - MAX_PRODUCTS;
	if (overflow <= 0) return;
	const toEvict = state.ids
		.map((id) => state.entities[id]) // may be undefined under noUncheckedIndexedAccess
		.filter((p): p is Product => p !== undefined) // typed guard, not `!`
		.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)) // oldest first
		.slice(0, overflow)
		.map((p) => p.id);
	adapter.removeMany(state, toEvict);
}

const catalogSlice = createSlice({
	name: "catalog",
	initialState: adapter.getInitialState(), // { ids: [], entities: {} }
	reducers: {
		productsUpserted(state, action: PayloadAction<Product[]>) {
			adapter.upsertMany(state, action.payload); // O(1) per entity, dedups by id
			evictToCapByAge(state); // bounded store (Part 4)
		},
		productRemoved(state, action: PayloadAction<string>) {
			adapter.removeOne(state, action.payload);
		},
		catalogCleared(state) {
			adapter.removeAll(state);
		},
	},
});

export const { productsUpserted, productRemoved, catalogCleared } =
	catalogSlice.actions;
export default catalogSlice.reducer;

// Generated selectors, bound to the catalog location in RootState. selectById is O(1).
const s = adapter.getSelectors((state: RootState) => state.catalog);
export const selectAllProducts = s.selectAll;
export const selectProductById = s.selectById;
export const selectProductCount = s.selectTotal;

// Filter + sort. Without memoization this allocates a new array on every call —
// `useSelector` would see prev !== next and re-render forever.
export const selectAffordableProducts = createSelector(
	[selectAllProducts],
	(products) =>
		products
			.filter((p) => p.priceCents <= 5000)
			.sort((a, b) => a.priceCents - b.priceCents),
);

// Derived object — a fresh {} every compute, so memoization is mandatory.
export const selectCategoryCounts = createSelector(
	[selectAllProducts],
	(products) =>
		products.reduce<Record<string, number>>((acc, p) => {
			acc[p.category] = (acc[p.category] ?? 0) + 1;
			return acc;
		}, {}),
);

// Parameterized. Reselect 5's default weakMapMemoize keys on argument identity,
// so primitives like 'books' cache correctly out of the box (no factory needed).
// The pitfall this DOESN'T solve: passing a freshly-allocated object literal
// (selectX(state, { id })) — every call is a different identity → cache miss.
export const selectProductsByCategory = createSelector(
	[selectAllProducts, (_state: RootState, category: string) => category],
	(products, category) => products.filter((p) => p.category === category),
);
