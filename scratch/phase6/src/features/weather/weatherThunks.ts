import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../app";
import { weatherApi } from "../../services";
import type { Forecast } from "../../services";
import type { WeatherError } from "./types";

export const fetchWeather = createAsyncThunk<
	Forecast,
	{ city: string },
	{ state: RootState; rejectValue: WeatherError }
>(
	"weather/fetchWeather",
	async ({ city }, { rejectWithValue, signal }) => {
		try {
			return await weatherApi.getForecast(city, { signal });
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
			throw e;
		}
	},
);
