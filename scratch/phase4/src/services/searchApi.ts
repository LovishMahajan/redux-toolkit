// Mock search service. Counts how many times it was actually called — used by the
// debounce test to prove only the LAST query reached the network.
export interface SearchHit {
	id: string;
	title: string;
}

let callCount = 0;
let pretendFail = false;

export function __resetSearchMock(): void {
	callCount = 0;
	pretendFail = false;
}
export function __getCallCount(): number {
	return callCount;
}
export function __setPretendFail(v: boolean): void {
	pretendFail = v;
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
	await wait(50, opts.signal);
	if (pretendFail) throw new Error("backend down");
	return [
		{ id: "h1", title: `${query}-result-1` },
		{ id: "h2", title: `${query}-result-2` },
	];
}
