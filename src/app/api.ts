import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query";

export type ApiError = { status: number; data: string };

export const api = createApi({
	reducerPath: "api",
	baseQuery: fakeBaseQuery<ApiError>(),
	tagTypes: ["Product", "Order", "Review"],
	endpoints: () => ({}),
});
