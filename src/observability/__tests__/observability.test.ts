// src/observability/__tests__/observability.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "../../features/auth";
import { cartReducer, itemAddedToCart, cartCleared } from "../../features/cart";
import { api } from "../../app/api";
import {
	timingMiddleware,
	analyticsMiddleware,
	auditMiddleware,
	sink,
} from "..";

const setup = () =>
	configureStore({
		reducer: {
			auth: authReducer,
			cart: cartReducer,
			[api.reducerPath]: api.reducer,
		},
		middleware: (gdm) =>
			gdm().concat(
				timingMiddleware,
				analyticsMiddleware,
				auditMiddleware,
				api.middleware,
			),
	});

beforeEach(() => sink.reset());

describe("observability middleware", () => {
	it("emits a mapped analytics event for a domain action", () => {
		const store = setup();
		store.dispatch(
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
			}),
		);
		expect(sink.analytics).toHaveLength(1);
		expect(sink.analytics[0]?.name).toBe("add_to_cart");
	});

	it("does NOT emit for unmapped actions", () => {
		const store = setup();
		store.dispatch(
			itemAddedToCart({
				productId: "p_1",
				name: "Pro",
				unitPriceCents: 4900,
			}),
		);
		store.dispatch(cartCleared()); // mapped → cart_cleared
		// itemRemovedFromCart is unmapped; nothing extra fires for it
		expect(sink.analytics.map((e) => e.name)).toEqual([
			"add_to_cart",
			"cart_cleared",
		]);
	});

	it("scrubs PII before it leaves the store", () => {
		const store = setup();
		// a raw fulfilled-shaped action carrying nested PII
		store.dispatch({
			type: "auth/loginUser/fulfilled",
			payload: {
				user: { id: "u_1", email: "dev@acme.io", password: "hunter2" },
				at: "now",
			},
		});
		const props = sink.analytics.at(-1)?.props as any;
		expect(props.user.email).toBe("[redacted]");
		expect(props.user.password).toBe("[redacted]");
		expect(props.user.id).toBe("u_1"); // non-sensitive survives
	});

	it("records latency for every action it sees (timing ran)", () => {
		const store = setup();
		store.dispatch(cartCleared());
		expect(sink.latency.some((s) => s.action === "cart/cartCleared")).toBe(
			true,
		);
	});
});
