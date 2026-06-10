// Note: also exports `ApiError`. Plain `export *` from the barrel would collide
// with weatherApi.ApiError. The barrel uses `export * as ...` to namespace each.
export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "SearchApiError";
	}
}

export interface SearchHit {
	id: string;
	title: string;
}

let callCount = 0;
export function __resetSearchMock(): void {
	callCount = 0;
}
export function __getCallCount(): number {
	return callCount;
}

function wait(ms: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		if (signal?.aborted)
			return reject(new DOMException("Aborted", "AbortError"));
		const t = setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			clearTimeout(t);
			reject(new DOMException("Aborted", "AbortError"));
		});
	});
}

export async function search(
	query: string,
	opts: { signal?: AbortSignal } = {},
): Promise<SearchHit[]> {
	callCount++;
	await wait(30, opts.signal);
	return [
		{ id: "h1", title: `${query}-result-1` },
		{ id: "h2", title: `${query}-result-2` },
	];
}
