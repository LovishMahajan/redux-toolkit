import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchHit } from "../../services";
import type { SearchState } from "./types";
import type { RootState } from "../../app";

const initialState: SearchState = {
	query: "",
	results: [],
	status: "idle",
};

const searchSlice = createSlice({
	name: "search",
	initialState,
	reducers: {
		queryChanged(state, action: PayloadAction<string>) {
			state.query = action.payload;
		},
		searchStarted(state) {
			state.status = "loading";
		},
		searchSucceeded(state, action: PayloadAction<SearchHit[]>) {
			state.status = "success";
			state.results = action.payload;
		},
	},
});

export const { queryChanged, searchStarted, searchSucceeded } =
	searchSlice.actions;
export default searchSlice.reducer;

export const selectQuery = (s: RootState) => s.search.query;
export const selectResults = (s: RootState) => s.search.results;
