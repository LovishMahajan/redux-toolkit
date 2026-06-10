import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchHit } from "../../services/searchApi";
import type { SearchState } from "./types";
import type { RootState } from "../../app/store";

const initialState: SearchState = {
	query: "",
	results: [],
	status: "idle",
	error: null,
};

const searchSlice = createSlice({
	name: "search",
	initialState,
	reducers: {
		// Synchronous — fires on every keystroke. The listener reacts to this.
		queryChanged(state, action: PayloadAction<string>) {
			state.query = action.payload;
			// Empty query → clear, no fetch needed.
			if (action.payload === "") {
				state.results = [];
				state.status = "idle";
				state.error = null;
			}
		},
		searchStarted(state) {
			state.status = "loading";
			state.error = null;
		},
		searchSucceeded(state, action: PayloadAction<SearchHit[]>) {
			state.status = "success";
			state.results = action.payload;
			state.error = null;
		},
		searchFailed(state, action: PayloadAction<string>) {
			state.status = "error";
			state.error = action.payload;
		},
	},
});

export const {
	queryChanged,
	searchStarted,
	searchSucceeded,
	searchFailed,
} = searchSlice.actions;
export default searchSlice.reducer;

export const selectQuery = (s: RootState) => s.search.query;
export const selectResults = (s: RootState) => s.search.results;
export const selectStatus = (s: RootState) => s.search.status;
