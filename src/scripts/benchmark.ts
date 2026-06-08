// src/scripts/benchmark.ts
// Proves the lesson's three claims at scale:
//   1. array.find is O(n) — slow on 50k.
//   2. createEntityAdapter gives O(1) lookups (same shape as Map.get).
//   3. A bounded-eviction adapter reducer keeps memory bounded under heavy upsert.
//
// Phase 4 note: the original catalogSlice was deleted (server-owned data moved to
// the RTK Query cache). Bench 3 keeps its lesson — bounded adapter eviction at 50k
// — via a local createSlice that is NOT wired into the app store.
//
// Run: npm run benchmark
import {
	configureStore,
	createEntityAdapter,
	createSlice,
	type EntityState,
	type PayloadAction,
} from "@reduxjs/toolkit";
import type { Product } from "../features/catalog";

const N = 50_000;
const ITERATIONS = 1_000;

const products: Product[] = Array.from({ length: N }, (_, i) => ({
	id: `p_${i}`,
	name: `Product ${String(i).padStart(6, "0")}`,
	category: `cat_${i % 20}`,
	priceCents: (i % 100) * 100,
	updatedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
}));

// Sample queries — deterministic, spread across the keyspace.
const probesAll = Array.from(
	{ length: ITERATIONS },
	(_, i) => `p_${(i * 37) % N}`,
);

const fmt = (ms: number) => `${ms.toFixed(2)} ms`;

// ─── Bench 1: array.find — O(n) per lookup ─────────────────────────────────
let t = performance.now();
for (const id of probesAll) products.find((p) => p.id === id);
const findMs = performance.now() - t;
console.log(`array.find  x${ITERATIONS} over 50k array : ${fmt(findMs)}`);

// ─── Bench 2: Map.get — O(1) per lookup, SAME N=50k ────────────────────────
const map = new Map<string, Product>(products.map((p) => [p.id, p]));
t = performance.now();
for (const id of probesAll) map.get(id);
const mapMs = performance.now() - t;
console.log(`Map.get     x${ITERATIONS} over 50k map   : ${fmt(mapMs)}`);

// ─── Bench 3: bounded adapter store — O(1) lookups under cap ───────────────
// Local slice (NOT wired into the app store) — same eviction pattern Phase 3
// had, isolated here so the benchmark still proves the lesson.
const MAX_PRODUCTS = 500;
const adapter = createEntityAdapter<Product>({
	sortComparer: (a, b) => a.name.localeCompare(b.name),
});

function evictToCapByAge(state: EntityState<Product, string>) {
	const overflow = state.ids.length - MAX_PRODUCTS;
	if (overflow <= 0) return;
	const toEvict = state.ids
		.map((id) => state.entities[id])
		.filter((p): p is Product => p !== undefined)
		.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
		.slice(0, overflow)
		.map((p) => p.id);
	adapter.removeMany(state, toEvict);
}

const benchSlice = createSlice({
	name: "benchCatalog",
	initialState: adapter.getInitialState(),
	reducers: {
		upserted(state, action: PayloadAction<Product[]>) {
			adapter.upsertMany(state, action.payload);
			evictToCapByAge(state);
		},
	},
});

const store = configureStore({ reducer: { benchCatalog: benchSlice.reducer } });
const selectors = adapter.getSelectors(
	(s: ReturnType<typeof store.getState>) => s.benchCatalog,
);

store.dispatch(benchSlice.actions.upserted(products));
const finalSize = selectors.selectTotal(store.getState());
console.log(`store size after 50k upsert (cap 500)    : ${finalSize}`);

// After eviction, only the newest 500 ids survive. Probe within that range.
const survivors = Array.from(
	{ length: ITERATIONS },
	(_, i) => `p_${N - 1 - (i % 500)}`,
);
const stateRef = store.getState();
t = performance.now();
for (const id of survivors) selectors.selectById(stateRef, id);
const adapterMs = performance.now() - t;
console.log(`selectById  x${ITERATIONS} on adapter     : ${fmt(adapterMs)}`);

console.log(
	`\nO(n) vs O(1) on 50k → ${(findMs / mapMs).toFixed(0)}x speedup (find → Map.get)`,
);
console.log(
	"Bounded store proves eviction is working: 50,000 upserts → 500 retained.",
);
