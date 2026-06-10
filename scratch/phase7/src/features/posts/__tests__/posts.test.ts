import { describe, it, expect, beforeEach } from "vitest";
import { makeStore } from "../../../app/store";
import {
	postsUpserted,
	postsCleared,
	postRemoved,
	selectAllPosts,
	selectPostById,
	selectPostCount,
	selectRecentPosts,
	selectAuthorCounts,
	selectPostsByAuthor,
} from "..";
import type { Post } from "..";

function make(id: string, authorId: string, dayOffset = 0): Post {
	return {
		id,
		authorId,
		title: `post-${id}`,
		body: "x",
		createdAt: new Date(2026, 0, 1 + dayOffset).toISOString(),
	};
}

describe("entity adapter basics", () => {
	it("upserts and selects by id in O(1)", () => {
		const store = makeStore();
		store.dispatch(
			postsUpserted([make("p_1", "a"), make("p_2", "b"), make("p_3", "a")]),
		);
		expect(selectPostCount(store.getState())).toBe(3);
		expect(selectPostById(store.getState(), "p_2")?.authorId).toBe("b");
	});

	it("maintains ids[] sorted by sortComparer (newest first)", () => {
		const store = makeStore();
		// Insert out of order; adapter must sort.
		store.dispatch(
			postsUpserted([
				make("p_old", "a", 0),
				make("p_new", "a", 10),
				make("p_mid", "a", 5),
			]),
		);
		const posts = selectAllPosts(store.getState());
		expect(posts.map((p) => p.id)).toEqual(["p_new", "p_mid", "p_old"]);
	});

	it("upsert dedups by id (merges instead of duplicating)", () => {
		const store = makeStore();
		store.dispatch(postsUpserted([make("p_1", "a")]));
		store.dispatch(
			postsUpserted([{ ...make("p_1", "a"), title: "renamed" }]),
		);
		expect(selectPostCount(store.getState())).toBe(1);
		expect(selectPostById(store.getState(), "p_1")?.title).toBe("renamed");
	});

	it("eviction caps the slice at MAX_POSTS (200)", () => {
		const store = makeStore();
		const many: Post[] = Array.from({ length: 500 }, (_, i) =>
			make(`p_${i}`, "a", i),
		);
		store.dispatch(postsUpserted(many));
		expect(selectPostCount(store.getState())).toBe(200);
	});
});

describe("memoization — createSelector caches outputs", () => {
	beforeEach(() => {});

	it("selectAllPosts returns the SAME reference until the slice changes", () => {
		const store = makeStore();
		store.dispatch(postsUpserted([make("p_1", "a")]));
		const ref1 = selectAllPosts(store.getState());
		const ref2 = selectAllPosts(store.getState());
		expect(ref1).toBe(ref2); // <-- this is what makes downstream memo work
	});

	it("selectRecentPosts caches between calls when state is unchanged", () => {
		const store = makeStore();
		store.dispatch(
			postsUpserted(
				Array.from({ length: 30 }, (_, i) => make(`p_${i}`, "a", i)),
			),
		);
		const a = selectRecentPosts(store.getState());
		const b = selectRecentPosts(store.getState());
		expect(a).toBe(b); // same array reference — no re-render trigger
		expect(a.length).toBe(10);
	});

	it("selectRecentPosts returns a NEW reference after a dispatch", () => {
		const store = makeStore();
		store.dispatch(postsUpserted([make("p_1", "a", 1)]));
		const a = selectRecentPosts(store.getState());
		store.dispatch(postsUpserted([make("p_2", "b", 2)]));
		const b = selectRecentPosts(store.getState());
		expect(a).not.toBe(b); // state changed → cache invalidated → re-computed
	});

	it("selectAuthorCounts memoizes the derived object", () => {
		const store = makeStore();
		store.dispatch(
			postsUpserted([
				make("p_1", "alice"),
				make("p_2", "bob"),
				make("p_3", "alice"),
			]),
		);
		const a = selectAuthorCounts(store.getState());
		const b = selectAuthorCounts(store.getState());
		expect(a).toBe(b); // same object reference
		expect(a).toEqual({ alice: 2, bob: 1 });
	});

	it("selectPostsByAuthor caches per-arg AND across calls", () => {
		const store = makeStore();
		store.dispatch(
			postsUpserted([
				make("p_1", "alice"),
				make("p_2", "bob"),
				make("p_3", "alice"),
			]),
		);
		const aliceA = selectPostsByAuthor(store.getState(), "alice");
		const aliceB = selectPostsByAuthor(store.getState(), "alice");
		const bobA = selectPostsByAuthor(store.getState(), "bob");
		expect(aliceA).toBe(aliceB); // same arg → same reference
		expect(aliceA).not.toBe(bobA); // different arg → different cache slot
		expect(aliceA.length).toBe(2);
		expect(bobA.length).toBe(1);
	});
});

describe("clear / remove", () => {
	it("postsCleared empties the slice", () => {
		const store = makeStore();
		store.dispatch(postsUpserted([make("p_1", "a")]));
		store.dispatch(postsCleared());
		expect(selectPostCount(store.getState())).toBe(0);
	});

	it("postRemoved removes by id and leaves others", () => {
		const store = makeStore();
		store.dispatch(postsUpserted([make("p_1", "a"), make("p_2", "b")]));
		store.dispatch(postRemoved("p_1"));
		expect(selectPostCount(store.getState())).toBe(1);
		expect(selectPostById(store.getState(), "p_1")).toBeUndefined();
		expect(selectPostById(store.getState(), "p_2")).toBeDefined();
	});
});
