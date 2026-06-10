import { store } from "../app/store";
import {
	postsUpserted,
	selectAllPosts,
	selectPostById,
	selectRecentPosts,
	selectAuthorCounts,
	selectPostsByAuthor,
} from "../features/posts";

store.dispatch(
	postsUpserted([
		{
			id: "p_1",
			authorId: "alice",
			title: "Hello",
			body: "world",
			createdAt: "2026-01-01T00:00:00.000Z",
		},
		{
			id: "p_2",
			authorId: "bob",
			title: "Second",
			body: "post",
			createdAt: "2026-01-03T00:00:00.000Z",
		},
		{
			id: "p_3",
			authorId: "alice",
			title: "Third",
			body: "again",
			createdAt: "2026-01-02T00:00:00.000Z",
		},
	]),
);

console.log("all posts (sorted newest-first):");
console.log(selectAllPosts(store.getState()).map((p) => `${p.id} @ ${p.createdAt}`));

console.log("\np_2:", selectPostById(store.getState(), "p_2")?.title);

console.log("\nauthor counts:", selectAuthorCounts(store.getState()));

console.log("\nalice's posts:", selectPostsByAuthor(store.getState(), "alice").map((p) => p.id));

console.log("\nrecent (memoized):", selectRecentPosts(store.getState()).map((p) => p.id));

// Prove memoization
const a = selectRecentPosts(store.getState());
const b = selectRecentPosts(store.getState());
console.log("\nselectRecentPosts call #1 === call #2 (same state):", a === b);
