// src/features/catalog/catalogApi.ts
import { api } from "../../app";
import type { Product, Review } from "./types";

// In-memory mock "server". Module-level let bindings so __resetCatalogMock
// can swap the references between test cases without callers losing freshness.
const seedProducts: Product[] = [
	{ id: "p_1", name: "Product 1", category: "books", priceCents: 1000, updatedAt: "2026-05-01T00:00:00.000Z" },
	{ id: "p_2", name: "Product 2", category: "books", priceCents: 1250, updatedAt: "2026-05-02T00:00:00.000Z" },
	{ id: "p_3", name: "Product 3", category: "music", priceCents: 1500, updatedAt: "2026-05-03T00:00:00.000Z" },
	{ id: "p_4", name: "Product 4", category: "music", priceCents: 1750, updatedAt: "2026-05-04T00:00:00.000Z" },
	{ id: "p_5", name: "Product 5", category: "video", priceCents: 2000, updatedAt: "2026-05-05T00:00:00.000Z" },
];

const seedReviews: Record<string, Review[]> = {
	p_1: [
		{ id: "r_1", productId: "p_1", rating: 4, body: "good", createdAt: "2026-05-10T00:00:00.000Z" },
		{ id: "r_2", productId: "p_1", rating: 5, body: "great", createdAt: "2026-05-11T00:00:00.000Z" },
	],
};

let mockProducts: Product[] = [...seedProducts];
let mockReviews: Record<string, Review[]> = structuredClone(seedReviews);
let nextReviewNum = 3;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAGE_SIZE = 2;

export const catalogApi = api.injectEndpoints({
	endpoints: (build) => ({
		getProducts: build.query<Product[], void>({
			queryFn: async () => {
				await wait(20);
				return { data: [...mockProducts] };
			},
			providesTags: (result) =>
				result
					? [
							{ type: "Product" as const, id: "LIST" },
							...result.map((p) => ({ type: "Product" as const, id: p.id })),
						]
					: [{ type: "Product" as const, id: "LIST" }],
		}),

		getProductsInfinite: build.infiniteQuery<Product[], void, number>({
			infiniteQueryOptions: {
				initialPageParam: 0,
				maxPages: 5,
				getNextPageParam: (lastPage, _allPages, lastPageParam) =>
					lastPage.length < PAGE_SIZE ? undefined : lastPageParam + 1,
			},
			queryFn: async ({ pageParam }) => {
				await wait(20);
				const start = pageParam * PAGE_SIZE;
				return { data: mockProducts.slice(start, start + PAGE_SIZE) };
			},
			providesTags: (result) =>
				result
					? [
							{ type: "Product" as const, id: "LIST" },
							...result.pages
								.flat()
								.map((p) => ({ type: "Product" as const, id: p.id })),
						]
					: [{ type: "Product" as const, id: "LIST" }],
		}),

		getProductReviews: build.query<Review[], string>({
			queryFn: async (productId) => {
				await wait(20);
				return { data: [...(mockReviews[productId] ?? [])] };
			},
			providesTags: (result, _e, productId) =>
				result
					? [
							{ type: "Review" as const, id: `LIST-${productId}` },
							...result.map((r) => ({ type: "Review" as const, id: r.id })),
						]
					: [{ type: "Review" as const, id: `LIST-${productId}` }],
		}),

		addReview: build.mutation<
			Review,
			{ productId: string; rating: number; body: string }
		>({
			queryFn: async ({ productId, rating, body }) => {
				await wait(20);
				if (productId === "fail") {
					return { error: { status: 500, data: "simulated failure" } };
				}
				const review: Review = {
					id: `r_${nextReviewNum++}`,
					productId,
					rating,
					body,
					createdAt: new Date().toISOString(),
				};
				(mockReviews[productId] ??= []).unshift(review);
				return { data: review };
			},
			// Cross-entity edge: a new review changes the product's aggregate rating,
			// so the product detail is stale too — invalidate both.
			invalidatesTags: (_r, _e, { productId }) => [
				{ type: "Review", id: `LIST-${productId}` },
				{ type: "Product", id: productId },
			],
			onQueryStarted: async (
				{ productId, rating, body },
				{ dispatch, queryFulfilled },
			) => {
				const optimistic: Review = {
					id: `tmp_${Date.now()}`,
					productId,
					rating,
					body,
					createdAt: new Date().toISOString(),
				};
				const patch = dispatch(
					catalogApi.util.updateQueryData(
						"getProductReviews",
						productId,
						(draft) => {
							draft.unshift(optimistic);
						},
					),
				);
				try {
					await queryFulfilled;
				} catch {
					patch.undo();
					// Rollback-failure recovery: if the cache moved between patch and undo
					// (background refetch, eviction), patch.undo() is a silent no-op.
					// Force a refetch back to known-good server truth.
					dispatch(
						catalogApi.util.invalidateTags([
							{ type: "Review", id: `LIST-${productId}` },
						]),
					);
				}
			},
		}),
	}),
});

export function __resetCatalogMock(): void {
	mockProducts = [...seedProducts];
	mockReviews = structuredClone(seedReviews);
	nextReviewNum = 3;
}
