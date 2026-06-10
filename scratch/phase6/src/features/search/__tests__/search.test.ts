import { describe, it, expect } from "vitest";
import { makeStore } from "../../../app";
import { queryChanged, selectQuery } from "..";
import { searchApi } from "../../../services";

describe("search feature (via barrel imports only)", () => {
	it("dispatches and selects through barrel exports", () => {
		const store = makeStore();
		store.dispatch(queryChanged("hello"));
		expect(selectQuery(store.getState())).toBe("hello");
	});

	it("namespace import disambiguates the two ApiError classes", () => {
		// If the barrel used `export *` instead of `export * as`, this would not
		// compile (two `ApiError` identifiers). Namespacing makes both reachable.
		const e1 = new searchApi.ApiError(500, "search down");
		expect(e1.name).toBe("SearchApiError");
	});
});
