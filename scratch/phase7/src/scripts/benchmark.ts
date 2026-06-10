// Mirror of the repo's benchmark, focused on the memoization win.
// Three benches:
//   1. selectAllPosts — reference stability over N calls (no work after first)
//   2. Naive filter (no memo) vs memoized selectRecentPosts
//   3. selectPostById over a capped store — O(1) reachability
import { makeStore } from "../app/store";
import {
	postsUpserted,
	selectAllPosts,
	selectRecentPosts,
	selectPostById,
	selectPostsByAuthor,
} from "../features/posts";
import type { Post } from "../features/posts";

const N = 2_000; // post count BEFORE the 200 eviction cap kicks in
const ITERATIONS = 50_000;

const fmt = (ms: number) => `${ms.toFixed(2)} ms`;

const posts: Post[] = Array.from({ length: N }, (_, i) => ({
	id: `p_${i}`,
	authorId: `a_${i % 50}`,
	title: `Post ${i}`,
	body: "lorem",
	createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
}));

const store = makeStore();
store.dispatch(postsUpserted(posts));

// ─── Bench 1: createSelector identity ──────────────────────────────────────
let t = performance.now();
let firstRef = selectAllPosts(store.getState());
let identical = 0;
for (let i = 0; i < ITERATIONS; i++) {
	if (selectAllPosts(store.getState()) === firstRef) identical++;
}
const allMs = performance.now() - t;
console.log(
	`selectAllPosts x${ITERATIONS}                  : ${fmt(allMs)} (${identical}/${ITERATIONS} cache hits)`,
);

// ─── Bench 2: naive vs memoized derived ────────────────────────────────────
t = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
	// Naive: a fresh array every call, also a fresh sort.
	selectAllPosts(store.getState())
		.slice()
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.slice(0, 10);
}
const naiveMs = performance.now() - t;

t = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
	selectRecentPosts(store.getState()); // memoized
}
const memoMs = performance.now() - t;

console.log(`naive derived  x${ITERATIONS}                  : ${fmt(naiveMs)}`);
console.log(`memoized       x${ITERATIONS}                  : ${fmt(memoMs)}`);
console.log(
	`→ memoization wins ${(naiveMs / memoMs).toFixed(0)}x on this workload`,
);

// ─── Bench 3: O(1) lookup ──────────────────────────────────────────────────
const state = store.getState();
const cap = state.posts.ids.length;
const probes = Array.from(
	{ length: ITERATIONS },
	(_, i) => state.posts.ids[i % cap] as string,
);

t = performance.now();
for (const id of probes) selectPostById(state, id);
const byIdMs = performance.now() - t;
console.log(
	`selectPostById x${ITERATIONS} on ${cap}-entry slice : ${fmt(byIdMs)}`,
);

// ─── Bench 4: parameterized cache hit ──────────────────────────────────────
t = performance.now();
let cacheHits = 0;
const firstByAuthor = selectPostsByAuthor(state, "a_7");
for (let i = 0; i < ITERATIONS; i++) {
	if (selectPostsByAuthor(state, "a_7") === firstByAuthor) cacheHits++;
}
const paramMs = performance.now() - t;
console.log(
	`selectPostsByAuthor x${ITERATIONS} (same arg)      : ${fmt(paramMs)} (${cacheHits}/${ITERATIONS} cache hits)`,
);

console.log(
	`\nstore size after ${N} upserts (cap 200): ${state.posts.ids.length}`,
);
