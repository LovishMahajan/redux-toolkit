// src/features/catalog/types.ts
export interface Product {
	id: string;
	name: string;
	category: string;
	priceCents: number;
	updatedAt: string; // ISO — sort tiebreak + eviction recency
}

export interface Review {
	id: string;
	productId: string;
	rating: number; // 1..5
	body: string;
	createdAt: string; // ISO
}
