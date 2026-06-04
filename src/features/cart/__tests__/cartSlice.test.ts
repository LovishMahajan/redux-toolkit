// src/features/cart/__tests__/cartSlice.test.ts
import { describe, it, expect } from "vitest";
import cartReducer, { itemAddedToCart } from "../cartSlice";
import type { CartState } from "../types";

describe("cart reducer", () => {
	it("defaults quantity to 1 on a new line", () => {
		const s = cartReducer(
			undefined,
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
			}),
		);
		expect(s.lines).toEqual([
			{
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
				quantity: 1,
			},
		]);
	});

	it("merges quantity for a repeated product", () => {
		const s1 = cartReducer(
			undefined,
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
			}),
		);
		const s2 = cartReducer(
			s1,
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
				quantity: 2,
			}),
		);
		expect(s2.lines[0]?.quantity).toBe(3); // ?. because noUncheckedIndexedAccess
	});

	it("does NOT mutate the previous state (Immer purity)", () => {
		const s1: CartState = {
			lines: [
				{
					productId: "p_1",
					name: "Pro",
					unitPriceCents: 4900,
					quantity: 1,
				},
			],
		};
		const before = JSON.stringify(s1);
		const s2 = cartReducer(
			s1,
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
			}),
		);
		expect(JSON.stringify(s1)).toBe(before); // previous state untouched
		expect(s2).not.toBe(s1); // brand-new reference
		expect(s2.lines[0]?.quantity).toBe(2);
	});
});
