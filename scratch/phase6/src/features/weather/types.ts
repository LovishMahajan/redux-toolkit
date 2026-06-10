import type { Forecast } from "../../services";

export type Resource<T, E> =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: T; revalidating: boolean }
	| { status: "error"; error: E; lastData?: T };

export type WeatherError =
	| { code: "not_found"; message: string }
	| { code: "network"; message: string }
	| { code: "unknown"; message: string };

export type WeatherState = Resource<Forecast, WeatherError>;
