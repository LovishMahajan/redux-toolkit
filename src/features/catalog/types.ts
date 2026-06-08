// src/features/catalog/types.ts
export interface Product {
    id: string;
    name: string;
    category: string;
    priceCents: number;
    updatedAt: string; // ISO — sort tiebreak + eviction recency
  }