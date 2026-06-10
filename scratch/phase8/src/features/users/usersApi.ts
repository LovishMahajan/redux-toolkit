import { api } from "../../app/api";
import type { User } from "./types";

// In-memory mock "server". A real app would call fetch via fetchBaseQuery.
const mockUsers: User[] = [
	{ id: "u_1", name: "Ada Lovelace", email: "ada@compute.io" },
	{ id: "u_2", name: "Grace Hopper", email: "grace@compute.io" },
	{ id: "u_3", name: "Alan Turing", email: "alan@compute.io" },
];

let queryFnCallCount = 0;
export function __getCallCount(): number {
	return queryFnCallCount;
}
export function __resetCallCount(): void {
	queryFnCallCount = 0;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const usersApi = api.injectEndpoints({
	endpoints: (build) => ({
		// LIST endpoint — no arg.
		// Notice the two generics: ReturnType (User[]) and ArgType (void).
		getUsers: build.query<User[], void>({
			queryFn: async () => {
				queryFnCallCount++;
				await wait(20);
				return { data: [...mockUsers] };
			},
		}),

		// PARAMETERIZED endpoint — id as arg.
		// Cache slot is keyed by (endpoint, arg) — so calling with "u_1" vs "u_2"
		// produces TWO independent cache slots, each with its own lifecycle.
		getUserById: build.query<User, string>({
			queryFn: async (id) => {
				queryFnCallCount++;
				await wait(20);
				const user = mockUsers.find((u) => u.id === id);
				if (!user) return { error: { status: 404, data: `no user ${id}` } };
				return { data: user };
			},
		}),
	}),
});
