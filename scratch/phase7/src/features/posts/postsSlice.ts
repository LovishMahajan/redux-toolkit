import {
	createEntityAdapter,
	createSelector,
	createSlice,
	type EntityState,
	type PayloadAction,
} from "@reduxjs/toolkit";
import type { Post } from "./types";
import type { RootState } from "../../app/store";

const MAX_POSTS = 200; // bounded working set

const adapter = createEntityAdapter<Post>({
	// ids[] are kept sorted by createdAt DESCENDING (newest first).
	// Note: sortComparer is invoked on every insert/upsert. Keep it cheap.
	sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

function evictOldest(state: EntityState<Post, string>) {
	const overflow = state.ids.length - MAX_POSTS;
	if (overflow <= 0) return;
	// ids[] is sorted newest-first, so the *last* `overflow` ids are oldest.
	const toEvict = state.ids.slice(state.ids.length - overflow);
	adapter.removeMany(state, toEvict);
}

const postsSlice = createSlice({
	name: "posts",
	initialState: adapter.getInitialState(),
	reducers: {
		postsUpserted(state, action: PayloadAction<Post[]>) {
			adapter.upsertMany(state, action.payload);
			evictOldest(state);
		},
		postRemoved(state, action: PayloadAction<string>) {
			adapter.removeOne(state, action.payload);
		},
		postsCleared(state) {
			adapter.removeAll(state);
		},
	},
});

export const { postsUpserted, postRemoved, postsCleared } = postsSlice.actions;
export default postsSlice.reducer;

// ─── Generated selectors (reference-stable, O(1) by id) ─────────────────────
const s = adapter.getSelectors((state: RootState) => state.posts);
export const selectAllPosts = s.selectAll;
export const selectPostById = s.selectById;
export const selectPostCount = s.selectTotal;
export const selectPostIds = s.selectIds;

// ─── Memoized derived selectors ─────────────────────────────────────────────

// Derived array: filter + slice → fresh array every compute → memo MANDATORY.
export const selectRecentPosts = createSelector(
	[selectAllPosts],
	(posts) => posts.slice(0, 10),
);

// Derived object: a fresh {} every compute → memo MANDATORY.
export const selectAuthorCounts = createSelector(
	[selectAllPosts],
	(posts) =>
		posts.reduce<Record<string, number>>((acc, p) => {
			acc[p.authorId] = (acc[p.authorId] ?? 0) + 1;
			return acc;
		}, {}),
);

// Parameterized selector — cache key includes the authorId arg.
// Reselect 5's weakMapMemoize handles primitive arg caching out of the box.
// Different authorId → different cache slot. Same authorId + same posts → cache hit.
export const selectPostsByAuthor = createSelector(
	[selectAllPosts, (_state: RootState, authorId: string) => authorId],
	(posts, authorId) => posts.filter((p) => p.authorId === authorId),
);
