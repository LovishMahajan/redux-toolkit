// src/features/orders/__tests__/ordersApi.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "../../../app/api";
import type { CartLine } from "../../cart/types";
import { ordersApi, __resetOrdersMock } from "../ordersApi";

const setupStore = () =>
	configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (gdm) => gdm().concat(api.middleware),
	});

const settle = (ms = 80) => new Promise((r) => setTimeout(r, ms));

const sampleLines: CartLine[] = [
	{ productId: "p_2", name: "Product 2", unitPriceCents: 1250, quantity: 1 },
];

beforeEach(() => __resetOrdersMock());

describe("ordersApi — tag graph", () => {
	it("createOrder invalidates Order/LIST → getOrders refetches", async () => {
		const store = setupStore();

		const sub = store.dispatch(ordersApi.endpoints.getOrders.initiate());
		await sub.unwrap();
		expect(
			ordersApi.endpoints.getOrders.select()(store.getState()).data?.length,
		).toBe(1);

		await store
			.dispatch(ordersApi.endpoints.createOrder.initiate({ lines: sampleLines }))
			.unwrap();
		await settle();

		expect(
			ordersApi.endpoints.getOrders.select()(store.getState()).data?.length,
		).toBe(2);

		sub.unsubscribe();
	});

	it("createOrder does NOT invalidate getOrderById('o_1')", async () => {
		const store = setupStore();

		const detailSub = store.dispatch(
			ordersApi.endpoints.getOrderById.initiate("o_1"),
		);
		await detailSub.unwrap();
		const reqIdBefore = ordersApi.endpoints.getOrderById.select("o_1")(
			store.getState(),
		).requestId;

		await store
			.dispatch(ordersApi.endpoints.createOrder.initiate({ lines: sampleLines }))
			.unwrap();
		await settle();

		const reqIdAfter = ordersApi.endpoints.getOrderById.select("o_1")(
			store.getState(),
		).requestId;
		expect(reqIdAfter).toBe(reqIdBefore); // no refetch — Order/o_1 tag wasn't hit

		detailSub.unsubscribe();
	});
});
