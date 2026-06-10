import { describe, it, expect, beforeEach } from "vitest";
import { makeStore } from "../../app/store";
import {
	incremented,
	credentialsRemembered,
	boom,
} from "../../features/explosive";
import { sink, scrub } from "..";

describe("actionCounter", () => {
	beforeEach(() => sink.reset());

	it("counts dispatched actions by type", () => {
		const store = makeStore();
		store.dispatch(incremented());
		store.dispatch(incremented());
		store.dispatch(incremented());
		expect(sink.counts.get("explosive/incremented")).toBe(3);
	});

	it("does NOT see the bootstrap action in modern RTK (counter intuitive)", () => {
		makeStore();
		// In OLD Redux, `@@INIT` flowed through every middleware. In modern RTK,
		// the bootstrap pass runs the reducer directly to produce the initial
		// state; user middleware doesn't see it. So sink.counts is empty until
		// the first real dispatch. Useful to know — don't write middleware that
		// assumes "I will be called at boot with @@INIT".
		expect(sink.counts.size).toBe(0);
	});
});

describe("crashReporter", () => {
	beforeEach(() => sink.reset());

	it("catches reducer throws and logs a scrubbed record", () => {
		const store = makeStore();
		expect(() =>
			store.dispatch(boom({ password: "hunter2" })),
		).toThrow("kaboom");
		expect(sink.crashes).toHaveLength(1);
		const crash = sink.crashes[0]!;
		expect(crash.action).toBe("explosive/boom");
		expect(crash.message).toContain("kaboom");
		// The PAYLOAD on the crash record must be scrubbed.
		expect(crash.payload).toEqual({ password: "[redacted]" });
		// The thrown error's message still contains the raw payload (we
		// didn't sanitize the throw itself — that's a deeper retrofit).
		// Scrub guarantees apply at the SINK boundary, not in flight.
		expect(crash.stack).toBeTruthy();
	});

	it("re-throws so the dispatch caller can react", () => {
		const store = makeStore();
		let caught: unknown = null;
		try {
			store.dispatch(boom({ password: "p" }));
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(Error);
	});

	it("does not interfere with non-throwing actions", () => {
		const store = makeStore();
		store.dispatch(incremented());
		expect(sink.crashes).toHaveLength(0);
		expect(store.getState().explosive.value).toBe(1);
	});

	it("counter still records the action that ultimately crashed", () => {
		const store = makeStore();
		expect(() => store.dispatch(boom({ password: "p" }))).toThrow();
		// actionCounter runs BEFORE crashReporter (it's earlier in .concat),
		// so the dispatch was counted before the reducer threw.
		expect(sink.counts.get("explosive/boom")).toBe(1);
	});
});

describe("scrub", () => {
	it("redacts top-level sensitive keys", () => {
		expect(scrub({ email: "a@b.com", name: "Lovish" })).toEqual({
			email: "[redacted]",
			name: "Lovish",
		});
	});
	it("redacts nested sensitive keys", () => {
		expect(
			scrub({ user: { id: "u_1", password: "p", profile: { token: "t" } } }),
		).toEqual({
			user: {
				id: "u_1",
				password: "[redacted]",
				profile: { token: "[redacted]" },
			},
		});
	});
	it("walks arrays", () => {
		expect(scrub([{ password: "p1" }, { password: "p2" }])).toEqual([
			{ password: "[redacted]" },
			{ password: "[redacted]" },
		]);
	});
	it("leaves primitives alone", () => {
		expect(scrub("hello")).toBe("hello");
		expect(scrub(42)).toBe(42);
		expect(scrub(null)).toBe(null);
	});
	it("is case-insensitive on key names", () => {
		expect(scrub({ Email: "x", PASSWORD: "y" })).toEqual({
			Email: "[redacted]",
			PASSWORD: "[redacted]",
		});
	});
});

describe("PII boundary: credentialsRemembered", () => {
	beforeEach(() => sink.reset());

	it("can sit in state safely; scrubbing only happens at the sink boundary", () => {
		const store = makeStore();
		store.dispatch(credentialsRemembered({ email: "a@b.com", password: "p" }));
		// State holds the real value — this is your app's data.
		expect(store.getState().explosive.lastLogin).toEqual({
			email: "a@b.com",
			password: "p",
		});
		// The boundary scrub only triggers when something leaves Redux.
	});
});
