import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query";

// Error shape the entire api uses. Real backends would have richer fields.
export interface ApiError {
	status: number;
	data: string;
}

// The ROOT api. Defined empty here; features inject endpoints onto it.
// reducerPath: where the cache lives in state.
// tagTypes:    the vocabulary (Phase 9 wires invalidation against these).
export const api = createApi({
	reducerPath: "api",
	baseQuery: fakeBaseQuery<ApiError>(),
	tagTypes: ["User", "Book"],
	endpoints: () => ({}),
});
