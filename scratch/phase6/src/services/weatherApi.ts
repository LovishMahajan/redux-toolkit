export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "WeatherApiError";
	}
}

export interface Forecast {
	city: string;
	tempC: number;
	conditions: string;
	fetchedAt: string;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted)
			return reject(new DOMException("Aborted", "AbortError"));
		const t = setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			clearTimeout(t);
			reject(new DOMException("Aborted", "AbortError"));
		});
	});
}

let outcomes: Array<"ok" | "transient" | "notfound"> = [];
export function __seedNext(seq: Array<"ok" | "transient" | "notfound">): void {
	outcomes = [...seq];
}

export async function getForecast(
	city: string,
	opts: { signal?: AbortSignal } = {},
): Promise<Forecast> {
	await wait(30, opts.signal);
	const outcome = outcomes.shift() ?? "ok";
	if (outcome === "transient") throw new ApiError(503, "service unavailable");
	if (outcome === "notfound") throw new ApiError(404, "no such city");
	return {
		city,
		tempC: 20,
		conditions: "partly cloudy",
		fetchedAt: new Date().toISOString(),
	};
}
