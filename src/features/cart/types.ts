// src/features/cart/types.ts
export interface CartLine {
	productId: string;
	name: string;
	unitPriceCents: number; // integer cents — money is never a float in state
	quantity: number;
}

export interface CartState {
	lines: CartLine[];
}
