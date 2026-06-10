import { describe, it, expect, beforeEach } from "vitest";
import { makeStore } from "../../../app/store";
import { fetchWeather, selectForecast, selectWeatherError } from "..";
import { __seedNext } from "../../../services/weatherApi";

describe("fetchWeather lifecycle", () => {
	beforeEach(() => __seedNext([])); // reset the fake server before each test

	it("idle → loading → success on fulfilled", async () => {
		const store = makeStore();
		const p = store.dispatch(fetchWeather({ city: "Tokyo" }));
		expect(store.getState().weather.status).toBe("loading"); // pending applies sync
		await p;
		expect(store.getState().weather.status).toBe("success");
		expect(selectForecast(store.getState())?.city).toBe("Tokyo");
	});

	it("retries a transient failure then succeeds", async () => {
		__seedNext(["transient", "ok"]);
		const store = makeStore();
		await store.dispatch(fetchWeather({ city: "Paris" }));
		const s = store.getState().weather;
		expect(s.status).toBe("success");
	});

	it("404 → typed error state (rejectWithValue)", async () => {
		__seedNext(["notfound"]);
		const store = makeStore();
		await store.dispatch(fetchWeather({ city: "Atlantis" }));
		const s = store.getState().weather;
		expect(s.status).toBe("error");
		if (s.status === "error") expect(s.error.code).toBe("not_found");
	});

	it("503 across all retries → network error", async () => {
		__seedNext(["transient", "transient", "transient"]);
		const store = makeStore();
		await store.dispatch(fetchWeather({ city: "Mars" }));
		const s = store.getState().weather;
		expect(s.status).toBe("error");
		if (s.status === "error") expect(s.error.code).toBe("network");
	});

	it("aborted fetch is not an error", async () => {
		const store = makeStore();
		const p = store.dispatch(fetchWeather({ city: "Tokyo" }));
		p.abort();
		await p;
		expect(store.getState().weather.status).toBe("idle");
	});

	it("preserves lastData on error after a prior success (revalidate-then-fail)", async () => {
		const store = makeStore();
		await store.dispatch(fetchWeather({ city: "Tokyo" })); // success
		__seedNext(["notfound"]);
		await store.dispatch(fetchWeather({ city: "Atlantis" })); // fail
		const s = store.getState().weather;
		expect(s.status).toBe("error");
		if (s.status === "error") {
			expect(s.error.code).toBe("not_found");
			expect(s.lastData?.city).toBe("Tokyo"); // previous good data preserved
		}
	});

	it("condition dedupes concurrent fetches", async () => {
		const store = makeStore();
		const p1 = store.dispatch(fetchWeather({ city: "Tokyo" }));
		const r2 = await store.dispatch(fetchWeather({ city: "Paris" }));
		expect(r2.meta.requestStatus).toBe("rejected");
		if (r2.meta.requestStatus === "rejected") {
			expect(r2.meta.condition).toBe(true);
		}
		await p1;
	});
});
