// src/features/catalog/__tests__/catalogSlice.test.ts
import { describe, it, expect } from "vitest";
// The Phase 3 slice is orphaned from the app store (Phase 4 moved product data
// into the RTK Query cache), but its eviction-policy lesson is still worth
// testing in isolation. Import the slice directly rather than through the barrel.
import catalogReducer, {
	productsUpserted,
	selectAffordableProducts,
	selectProductById,
	selectProductCount,
} from "../catalogSlice";
import type { Product } from "../types";

const makeProduct = (i: number, overrides: Partial<Product> = {}): Product => ({
	id: `p_${i}`,
	name: `Product ${String(i).padStart(4, "0")}`,
	category: `cat_${i % 5}`,
	priceCents: (i % 100) * 100,
	updatedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
	...overrides,
});

const wrap = (catalog: ReturnType<typeof catalogReducer>) => ({ catalog });

describe("catalog slice — adapter wiring", () => {
	it("selectProductById is O(1) and returns the right entity", () => {
		const p1 = makeProduct(1);
		const p2 = makeProduct(2);
		const state = wrap(catalogReducer(undefined, productsUpserted([p1, p2])));
		expect(selectProductById(state, p1.id)).toEqual(p1);
		expect(selectProductById(state, p2.id)).toEqual(p2);
		expect(selectProductById(state, "missing")).toBeUndefined();
	});
});

describe("catalog slice — memoized selector reference stability", () => {
	// THIS is the proof the lesson's render-storm claim hinges on.
	// In React, `useSelector` re-renders iff prev !== next. A memoized selector
	// must return the SAME reference when its inputs haven't changed.
	it("returns a STABLE reference when inputs are unchanged", () => {
		const state = wrap(
			catalogReducer(
				undefined,
				productsUpserted([makeProduct(1, { priceCents: 1000 })]),
			),
		);
		const a = selectAffordableProducts(state);
		const b = selectAffordableProducts(state);
		expect(a).toBe(b); // same reference → no re-render in React
	});

	it("returns a NEW reference only after the data actually changes", () => {
		const state1 = wrap(
			catalogReducer(
				undefined,
				productsUpserted([makeProduct(1, { priceCents: 1000 })]),
			),
		);
		const a = selectAffordableProducts(state1);
		const state2 = wrap(
			catalogReducer(
				state1.catalog,
				productsUpserted([makeProduct(2, { priceCents: 2000 })]),
			),
		);
		const b = selectAffordableProducts(state2);
		expect(a).not.toBe(b); // data changed → new reference → re-render, correctly
	});
});

describe("catalog slice — bounded store via eviction", () => {
	it("stays bounded at MAX_PRODUCTS (500) under heavy upsert", () => {
		const products = Array.from({ length: 5000 }, (_, i) => makeProduct(i));
		const state = wrap(catalogReducer(undefined, productsUpserted(products)));
		expect(selectProductCount(state)).toBe(500);
	});

	it("evicts the oldest entries by updatedAt first", () => {
		// 50 old + 500 new = 550 → overflow 50 → all 50 old should be evicted.
		const old = Array.from({ length: 50 }, (_, i) =>
			makeProduct(i, {
				id: `old_${i}`,
				updatedAt: "2025-01-01T00:00:00.000Z",
			}),
		);
		const fresh = Array.from({ length: 500 }, (_, i) =>
			makeProduct(i + 100, {
				id: `new_${i}`,
				updatedAt: "2026-06-01T00:00:00.000Z",
			}),
		);
		const state = wrap(
			catalogReducer(undefined, productsUpserted([...old, ...fresh])),
		);
		expect(selectProductCount(state)).toBe(500);
		for (const p of old) {
			expect(selectProductById(state, p.id)).toBeUndefined();
		}
		// Spot-check: a fresh one survives.
		expect(selectProductById(state, "new_0")).toBeDefined();
	});
});
