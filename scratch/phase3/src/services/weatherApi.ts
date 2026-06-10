// Pure fetcher — no Redux. Could run in a CLI.
// Throws ApiError for HTTP-shaped failures, DOMException for aborts.

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
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

// Toggle for tests: control which calls fail without rewriting the service.
let nextResults: Array<"ok" | "transient" | "notfound"> = [];
export function __seedNext(seq: Array<"ok" | "transient" | "notfound">): void {
	nextResults = [...seq];
}

export async function getForecast(
	city: string,
	opts: { signal?: AbortSignal } = {},
): Promise<Forecast> {
	await wait(50, opts.signal);
	const outcome = nextResults.shift() ?? "ok";
	if (outcome === "transient") throw new ApiError(503, "service unavailable");
	if (outcome === "notfound") throw new ApiError(404, "no such city");
	return {
		city,
		tempC: 20 + Math.floor(Math.random() * 10),
		conditions: "partly cloudy",
		fetchedAt: new Date().toISOString(),
	};
}
