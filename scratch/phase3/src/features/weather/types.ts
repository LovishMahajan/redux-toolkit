import type { Forecast } from "../../services/weatherApi";

// The canonical request-lifecycle union from the authSlice comment.
// `revalidating` lets the UI keep showing stale data while a refetch is in flight.
// `lastData` lets an error screen still show the previous good value.
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
