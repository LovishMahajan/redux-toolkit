// src/features/orders/ordersApi.ts
import { api } from "../../app";
import type { CartLine } from "../cart/types";
import type { Order } from "./types";

// In-memory mock "server" — mutations append to this list.
const seedOrders: Order[] = [
	{
		id: "o_1",
		lines: [
			{ productId: "p_1", name: "Product 1", unitPriceCents: 1000, quantity: 2 },
		],
		totalCents: 2000,
		status: "confirmed",
		createdAt: "2026-05-15T00:00:00.000Z",
	},
];
const mockOrders: Order[] = [...seedOrders];
let nextOrderNum = 2;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const ordersApi = api.injectEndpoints({
	endpoints: (build) => ({
		getOrders: build.query<Order[], void>({
			queryFn: async () => {
				await wait(20);
				return { data: [...mockOrders] };
			},
			providesTags: (result) =>
				result
					? [
							{ type: "Order" as const, id: "LIST" },
							...result.map((o) => ({ type: "Order" as const, id: o.id })),
						]
					: [{ type: "Order" as const, id: "LIST" }],
		}),

		getOrderById: build.query<Order, string>({
			queryFn: async (id) => {
				await wait(20);
				const found = mockOrders.find((o) => o.id === id);
				if (!found) return { error: { status: 404, data: "not found" } };
				return { data: found };
			},
			providesTags: (_r, _e, id) => [{ type: "Order" as const, id }],
		}),

		createOrder: build.mutation<Order, { lines: CartLine[] }>({
			queryFn: async ({ lines }) => {
				await wait(20);
				const order: Order = {
					id: `o_${nextOrderNum++}`,
					lines,
					totalCents: lines.reduce(
						(sum, l) => sum + l.unitPriceCents * l.quantity,
						0,
					),
					status: "pending",
					createdAt: new Date().toISOString(),
				};
				mockOrders.push(order);
				return { data: order };
			},
			// LIST-only invalidation. getOrderById(existingId) is NOT invalidated —
			// the demo proves this asymmetry.
			invalidatesTags: [{ type: "Order", id: "LIST" }],
		}),
	}),
});

// Test/demo hook: reset the in-memory mock between runs.
export function __resetOrdersMock(): void {
	mockOrders.length = 0;
	mockOrders.push(...seedOrders);
	nextOrderNum = 2;
}
