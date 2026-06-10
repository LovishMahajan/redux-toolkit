// Demo: every import below comes from a BARREL, never a file path.
// Compare to imports like "../features/weather/weatherSlice" — that's the
// anti-pattern this phase teaches you to avoid.
import { store } from "../app";
import {
	fetchWeather,
	selectWeather,
	queryChanged,
	selectQuery,
	selectResults,
	searchSucceeded,
} from "../features";
import { sink } from "../observability";
import { weatherApi, searchApi } from "../services";

console.log("--- weather flow ---");
await store.dispatch(fetchWeather({ city: "Tokyo" }));
console.log("weather =", selectWeather(store.getState()));

console.log("\n--- error class collision (handled by namespace barrel) ---");
console.log("weatherApi.ApiError:", new weatherApi.ApiError(404, "x").name);
console.log("searchApi.ApiError: ", new searchApi.ApiError(500, "y").name);

console.log("\n--- search flow ---");
store.dispatch(queryChanged("cats"));
console.log("query =", selectQuery(store.getState()));
const hits = await searchApi.search("cats");
store.dispatch(searchSucceeded(hits));
console.log("results =", selectResults(store.getState()));

console.log("\n--- crashes (none) ---");
console.log(sink.crashes);
