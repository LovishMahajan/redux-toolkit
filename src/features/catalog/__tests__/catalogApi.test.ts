// src/features/catalog/__tests__/catalogApi.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "../../../app/api";
import { catalogApi, __resetCatalogMock } from "../catalogApi";

const setupStore = () =>
	configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (gdm) => gdm().concat(api.middleware),
	});

const settle = (ms = 80) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => __resetCatalogMock());

describe("catalogApi — cache hit", () => {
	it("a second initiate returns the cached entry (requestId unchanged)", async () => {
		const store = setupStore();

		await store.dispatch(catalogApi.endpoints.getProducts.initiate()).unwrap();
		const reqIdAfterFirst = catalogApi.endpoints.getProducts.select()(
			store.getState(),
		).requestId;

		await store.dispatch(catalogApi.endpoints.getProducts.initiate()).unwrap();
		const reqIdAfterSecond = catalogApi.endpoints.getProducts.select()(
			store.getState(),
		).requestId;

		expect(reqIdAfterSecond).toBe(reqIdAfterFirst); // no second queryFn run
	});
});

describe("catalogApi — optimistic update (happy path)", () => {
	it("patches getProductReviews cache synchronously on addReview dispatch", async () => {
		const store = setupStore();

		await store
			.dispatch(catalogApi.endpoints.getProductReviews.initiate("p_1"))
			.unwrap();

		const before = catalogApi.endpoints.getProductReviews.select("p_1")(
			store.getState(),
		);
		expect(before.data?.length).toBe(2);

		const mut = store.dispatch(
			catalogApi.endpoints.addReview.initiate({
				productId: "p_1",
				rating: 5,
				body: "x",
			}),
		);

		// onQueryStarted runs synchronously — the patch is visible before await.
		const midflight = catalogApi.endpoints.getProductReviews.select("p_1")(
			store.getState(),
		);
		expect(midflight.data?.length).toBe(3);
		expect(midflight.data?.[0]?.id).toMatch(/^tmp_/);

		await mut.unwrap();
		await settle(); // tag invalidation triggers refetch

		const after = catalogApi.endpoints.getProductReviews.select("p_1")(
			store.getState(),
		);
		expect(after.data?.length).toBe(3);
		// The optimistic tmp_ row was replaced by the real r_ row from the refetch.
		expect(after.data?.[0]?.id).toMatch(/^r_/);
	});
});

describe("catalogApi — optimistic update (rollback)", () => {
	it("undoes the patch when addReview rejects", async () => {
		const store = setupStore();

		await store
			.dispatch(catalogApi.endpoints.getProductReviews.initiate("fail"))
			.unwrap();

		const before = catalogApi.endpoints.getProductReviews.select("fail")(
			store.getState(),
		);
		expect(before.data?.length).toBe(0);

		const mut = store.dispatch(
			catalogApi.endpoints.addReview.initiate({
				productId: "fail",
				rating: 1,
				body: "no",
			}),
		);

		const midflight = catalogApi.endpoints.getProductReviews.select("fail")(
			store.getState(),
		);
		expect(midflight.data?.length).toBe(1); // optimistic row visible

		const result = await mut;
		expect("error" in result).toBe(true);

		await settle(); // invalidate-fallback refetch

		const after = catalogApi.endpoints.getProductReviews.select("fail")(
			store.getState(),
		);
		expect(after.data?.length).toBe(0); // rolled back
	});
});
