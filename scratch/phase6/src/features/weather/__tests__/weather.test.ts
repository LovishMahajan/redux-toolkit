import { describe, it, expect, beforeEach } from "vitest";
import { makeStore } from "../../../app";
import { fetchWeather, selectWeather } from "..";
import { weatherApi } from "../../../services";

// Use the REAL store from app/. RootState is typed against the full root
// reducer; building partial stores in tests fights that typing.

describe("weather feature (via barrel imports only)", () => {
	beforeEach(() => weatherApi.__seedNext([]));

	it("imports cleanly through the feature barrel", async () => {
		// This test exists to prove the barrel ships the right API:
		// - weatherReducer (default re-exported as named)
		// - fetchWeather (thunk)
		// - selectWeather (selector)
		const store = makeStore();
		await store.dispatch(fetchWeather({ city: "Tokyo" }));
		const w = selectWeather(store.getState());
		expect(w.status).toBe("success");
	});

	it("accesses weatherApi.ApiError via namespace barrel", () => {
		// Both services define ApiError; namespace re-export keeps them distinct.
		const e = new weatherApi.ApiError(500, "boom");
		expect(e).toBeInstanceOf(weatherApi.ApiError);
		expect(e.status).toBe(500);
	});
});
