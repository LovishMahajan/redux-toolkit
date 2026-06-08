// src/scripts/demo-rtkq.ts
// Phase 4 — RTK Query, driven headlessly via store.dispatch(endpoint.initiate(...)).
// React hooks land in Phase 5; here every interaction goes through the store directly.
//
// Walks through: cache hit, infinite pagination, tag-driven invalidation (LIST vs
// detail asymmetry), and optimistic update (happy + rollback).
//
// Run: npm run demo:rtkq
import { store } from "../app";
import { catalogApi } from "../features/catalog";
import { ordersApi } from "../features/orders";
import type { CartLine } from "../features/cart/types";

const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ms = (n: number) => `${n.toFixed(1)}ms`;

async function main() {
	// ─── 1. Query: fetch + cache hit ───────────────────────────────────────
	console.log("\n── 1. getProducts: fetch then cache hit");
	const t1 = performance.now();
	const productsSub = store.dispatch(
		catalogApi.endpoints.getProducts.initiate(),
	);
	await productsSub.unwrap();
	const firstMs = performance.now() - t1;

	const t2 = performance.now();
	await store.dispatch(catalogApi.endpoints.getProducts.initiate()).unwrap();
	const secondMs = performance.now() - t2;

	console.log(`  first  call: ${ms(firstMs)} (network)`);
	console.log(`  second call: ${ms(secondMs)} (cache hit — no queryFn run)`);

	// ─── 2. Infinite query: page 0 → 1 → 2, then end ───────────────────────
	console.log("\n── 2. getProductsInfinite: paginate to the end");
	const infiniteSub = store.dispatch(
		catalogApi.endpoints.getProductsInfinite.initiate({}),
	);
	await infiniteSub.unwrap();
	let snap = catalogApi.endpoints.getProductsInfinite.select({})(
		store.getState(),
	);
	console.log(
		`  page 0 fetched. pages=${snap.data?.pages.length} hasNext=${snap.hasNextPage}`,
	);

	await store
		.dispatch(
			catalogApi.endpoints.getProductsInfinite.initiate(
				{},
				{ direction: "forward" },
			),
		)
		.unwrap();
	snap = catalogApi.endpoints.getProductsInfinite.select({})(store.getState());
	console.log(
		`  page 1 fetched. pages=${snap.data?.pages.length} hasNext=${snap.hasNextPage}`,
	);

	await store
		.dispatch(
			catalogApi.endpoints.getProductsInfinite.initiate(
				{},
				{ direction: "forward" },
			),
		)
		.unwrap();
	snap = catalogApi.endpoints.getProductsInfinite.select({})(store.getState());
	const flat = snap.data?.pages.flat().length ?? 0;
	console.log(
		`  page 2 fetched. pages=${snap.data?.pages.length} hasNext=${snap.hasNextPage} flat=${flat}`,
	);

	// ─── 3. Orders LIST invalidation: createOrder → getOrders refetches ────
	console.log("\n── 3. createOrder invalidates Order/LIST → getOrders refetches");
	const ordersSub = store.dispatch(ordersApi.endpoints.getOrders.initiate());
	await ordersSub.unwrap();
	let orders = ordersApi.endpoints.getOrders.select()(store.getState());
	console.log(`  before: ${orders.data?.length} order(s)`);

	const lines: CartLine[] = [
		{ productId: "p_2", name: "Product 2", unitPriceCents: 1250, quantity: 1 },
	];
	await store
		.dispatch(ordersApi.endpoints.createOrder.initiate({ lines }))
		.unwrap();
	await settle(); // give the refetch from invalidation a beat to land
	orders = ordersApi.endpoints.getOrders.select()(store.getState());
	console.log(
		`  after:  ${orders.data?.length} order(s) (LIST tag invalidated → refetch)`,
	);

	// ─── 4. Order detail NOT invalidated by createOrder ────────────────────
	console.log("\n── 4. createOrder does NOT invalidate getOrderById('o_1')");
	const detailSub = store.dispatch(
		ordersApi.endpoints.getOrderById.initiate("o_1"),
	);
	await detailSub.unwrap();
	const detailBefore = ordersApi.endpoints.getOrderById.select("o_1")(
		store.getState(),
	);
	const reqIdBefore = detailBefore.requestId;
	await store
		.dispatch(ordersApi.endpoints.createOrder.initiate({ lines }))
		.unwrap();
	await settle();
	const detailAfter = ordersApi.endpoints.getOrderById.select("o_1")(
		store.getState(),
	);
	const reqIdAfter = detailAfter.requestId;
	console.log(
		`  o_1 requestId stable: ${reqIdBefore === reqIdAfter} (no refetch — granular tag held)`,
	);
	orders = ordersApi.endpoints.getOrders.select()(store.getState());
	console.log(
		`  but getOrders did refetch: now ${orders.data?.length} order(s)`,
	);

	// ─── 5. Optimistic update — happy path ─────────────────────────────────
	console.log("\n── 5. addReview (happy): optimistic patch, then real replacement");
	const reviewsSub = store.dispatch(
		catalogApi.endpoints.getProductReviews.initiate("p_1"),
	);
	await reviewsSub.unwrap();
	let reviews = catalogApi.endpoints.getProductReviews.select("p_1")(
		store.getState(),
	);
	console.log(
		`  initial: ${reviews.data?.length} reviews — ids=${reviews.data?.map((r) => r.id).join(",")}`,
	);

	const mut = store.dispatch(
		catalogApi.endpoints.addReview.initiate({
			productId: "p_1",
			rating: 5,
			body: "optimistic",
		}),
	);
	// onQueryStarted runs SYNCHRONOUSLY — patch is already visible.
	reviews = catalogApi.endpoints.getProductReviews.select("p_1")(
		store.getState(),
	);
	console.log(
		`  mid-flight (optimistic): ${reviews.data?.length} reviews — ids=${reviews.data?.map((r) => r.id).join(",")}`,
	);

	await mut.unwrap();
	await settle(); // wait for invalidation-driven refetch
	reviews = catalogApi.endpoints.getProductReviews.select("p_1")(
		store.getState(),
	);
	console.log(
		`  after settle: ${reviews.data?.length} reviews — ids=${reviews.data?.map((r) => r.id).join(",")} (tmp_ → real)`,
	);

	// ─── 6. Optimistic update — failure rollback ───────────────────────────
	console.log("\n── 6. addReview (fail): optimistic patch, then rollback");
	const failSub = store.dispatch(
		catalogApi.endpoints.getProductReviews.initiate("fail"),
	);
	await failSub.unwrap();
	let failReviews = catalogApi.endpoints.getProductReviews.select("fail")(
		store.getState(),
	);
	console.log(`  initial: ${failReviews.data?.length} reviews`);

	const failMut = store.dispatch(
		catalogApi.endpoints.addReview.initiate({
			productId: "fail",
			rating: 1,
			body: "should be rolled back",
		}),
	);
	failReviews = catalogApi.endpoints.getProductReviews.select("fail")(
		store.getState(),
	);
	console.log(
		`  mid-flight (optimistic): ${failReviews.data?.length} reviews — ids=${failReviews.data?.map((r) => r.id).join(",")}`,
	);

	const result = await failMut;
	if ("error" in result) {
		console.log(`  mutation rejected (expected): ${JSON.stringify(result.error)}`);
	}
	await settle();
	failReviews = catalogApi.endpoints.getProductReviews.select("fail")(
		store.getState(),
	);
	console.log(
		`  after rollback: ${failReviews.data?.length} reviews — patched row removed`,
	);

	// Release subscriptions — keepUnusedDataFor (60s default) starts evicting.
	productsSub.unsubscribe();
	infiniteSub.unsubscribe();
	ordersSub.unsubscribe();
	detailSub.unsubscribe();
	reviewsSub.unsubscribe();
	failSub.unsubscribe();

	console.log("\n── done.");
}

// The unsubscribed cache entries each have a 60s keepUnusedDataFor timer
// running — Node keeps the event loop alive while timers are scheduled. In a
// real app those expire and evict naturally; in a one-shot script we just exit.
main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
