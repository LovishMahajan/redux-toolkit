// src/services/authApi.ts
import type { User } from "../features/auth";

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

export async function login(
	creds: { email: string; password: string },
	opts: { signal?: AbortSignal },
): Promise<{ user: User }> {
	await wait(300, opts.signal);
	if (creds.email === "flaky@acme.io")
		throw new ApiError(503, "service unavailable"); // transient
	if (creds.password !== "correct")
		throw new ApiError(401, "invalid credentials"); // expected
	return {
		user: {
			id: "u_1",
			email: creds.email,
			displayName: creds.email.split("@")[0] ?? "user",
		},
	};
}
