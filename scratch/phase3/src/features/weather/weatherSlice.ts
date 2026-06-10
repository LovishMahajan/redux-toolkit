import { createSlice } from "@reduxjs/toolkit";
import { fetchWeather } from "./weatherThunks";
import type { WeatherState } from "./types";
import type { RootState } from "../../app/store";

const initialState = { status: "idle" } as WeatherState;

const weatherSlice = createSlice({
	name: "weather",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchWeather.pending, (state) => {
			// If we already have data, mark it revalidating instead of wiping it.
			// Otherwise transition to loading.
			if (state.status === "success") {
				return { ...state, revalidating: true };
			}
			return { status: "loading" as const };
		});
		builder.addCase(fetchWeather.fulfilled, (_state, action) => {
			return {
				status: "success" as const,
				data: action.payload,
				revalidating: false,
			};
		});
		builder.addCase(fetchWeather.rejected, (state, action) => {
			if (action.meta.aborted) {
				// User cancelled — drop back to whatever we had. Don't show an error.
				return state.status === "success" ? { ...state, revalidating: false } : { status: "idle" as const };
			}
			const error = action.payload ?? {
				code: "unknown" as const,
				message: action.error.message ?? "Unknown error",
			};
			// Preserve lastData so the UI can keep showing the old forecast under the error.
			const lastData = state.status === "success" ? state.data : undefined;
			return lastData
				? { status: "error" as const, error, lastData }
				: { status: "error" as const, error };
		});
	},
});

export default weatherSlice.reducer;

export const selectWeatherStatus = (s: RootState) => s.weather.status;
export const selectForecast = (s: RootState) =>
	s.weather.status === "success" ? s.weather.data : null;
export const selectWeatherError = (s: RootState) =>
	s.weather.status === "error" ? s.weather.error : null;
