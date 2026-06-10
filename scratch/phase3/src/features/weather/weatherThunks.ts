import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import * as weatherApi from "../../services/weatherApi";
import type { Forecast } from "../../services/weatherApi";
import type { WeatherError } from "./types";

// Retry helper — only retries transient (503) failures, never 4xx or aborts.
async function withRetry<T>(
	fn: () => Promise<T>,
	signal: AbortSignal,
	{ attempts = 3, baseMs = 50 } = {},
): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		if (signal.aborted)
			throw new DOMException("Aborted", "AbortError");
		try {
			return await fn();
		} catch (e) {
			lastErr = e;
			if (e instanceof DOMException && e.name === "AbortError") throw e;
			if (!(e instanceof weatherApi.ApiError)) throw e;
			if (e.status !== 503) throw e; // only retry transients
			if (i === attempts - 1) throw e; // last attempt — give up
			// Exponential backoff
			await new Promise<void>((r) => setTimeout(r, baseMs * 2 ** i));
		}
	}
	throw lastErr;
}

export const fetchWeather = createAsyncThunk<
	Forecast, // Returned
	{ city: string }, // ThunkArg
	{ state: RootState; rejectValue: WeatherError } // Config
>(
	"weather/fetchWeather",
	async ({ city }, { rejectWithValue, signal }) => {
		try {
			const forecast = await withRetry(
				() => weatherApi.getForecast(city, { signal }),
				signal,
			);
			return forecast;
		} catch (e) {
			if (e instanceof weatherApi.ApiError) {
				if (e.status === 404)
					return rejectWithValue({
						code: "not_found",
						message: `No forecast for "${city}".`,
					});
				if (e.status === 503)
					return rejectWithValue({
						code: "network",
						message: "Weather service unavailable.",
					});
			}
			throw e; // unexpected — bubble to action.error
		}
	},
	{
		// Dedup: don't fire another fetch while one is in flight.
		condition: (_arg, { getState }) =>
			getState().weather.status !== "loading",
	},
);
