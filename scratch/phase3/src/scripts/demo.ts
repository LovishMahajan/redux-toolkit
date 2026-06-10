// End-to-end manual demo — proves the thunk drives the slice through the lifecycle.
import { store } from "../app/store";
import {
	fetchWeather,
	selectForecast,
	selectWeatherStatus,
} from "../features/weather";
import { __seedNext } from "../services/weatherApi";

const log = (label: string) =>
	console.log(
		label,
		"status =",
		selectWeatherStatus(store.getState()),
		"forecast =",
		selectForecast(store.getState())?.tempC ?? "-",
	);

log("initial");

await store.dispatch(fetchWeather({ city: "Tokyo" }));
log("after Tokyo (ok)");

__seedNext(["transient", "ok"]);
await store.dispatch(fetchWeather({ city: "Paris" }));
log("after Paris (retry then ok)");

__seedNext(["notfound"]);
await store.dispatch(fetchWeather({ city: "Atlantis" }));
log("after Atlantis (404)");

console.log("final state:", JSON.stringify(store.getState(), null, 2));
