// src/features/orders/types.ts
import type { CartLine } from "../cart/types";

export type OrderStatus = "pending" | "confirmed" | "shipped";

export interface Order {
	id: string;
	lines: CartLine[];
	totalCents: number;
	status: OrderStatus;
	createdAt: string; // ISO
}
