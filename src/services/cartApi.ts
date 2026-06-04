import type { CartLine } from "../features/cart/types";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
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

export async function persistCart(lines: CartLine[], signal?: AbortSignal) {
	await wait(300, signal);
	if (lines.length === 0) throw new ApiError(400, "Cart is empty");
	if (lines.some((l) => l.quantity <= 0))
		throw new ApiError(400, "Invalid quantity");
	if (lines.some((l) => l.unitPriceCents <= 0))
		throw new ApiError(400, "Invalid price");
	if (lines.some((l) => l.productId === ""))
		throw new ApiError(400, "Invalid product ID");
	return lines as CartLine[];
}
