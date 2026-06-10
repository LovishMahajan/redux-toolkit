import { createSlice } from "@reduxjs/toolkit";
import { fetchWeather } from "./weatherThunks";
import type { WeatherState } from "./types";
import type { RootState } from "../../app";

const initialState = { status: "idle" } as WeatherState;

const weatherSlice = createSlice({
	name: "weather",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchWeather.pending, () => ({ status: "loading" as const }));
		builder.addCase(fetchWeather.fulfilled, (_s, action) => ({
			status: "success" as const,
			data: action.payload,
			revalidating: false,
		}));
		builder.addCase(fetchWeather.rejected, (_s, action) => {
			if (action.meta.aborted) return { status: "idle" as const };
			const error = action.payload ?? {
				code: "unknown" as const,
				message: action.error.message ?? "Unknown",
			};
			return { status: "error" as const, error };
		});
	},
});

export default weatherSlice.reducer;
export const selectWeather = (s: RootState) => s.weather;
