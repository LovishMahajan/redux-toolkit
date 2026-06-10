import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CounterState } from "./types";
import type { RootState } from "../../app/store";

const MIN = -100;
const MAX = 100;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

const initialState: CounterState = { value: 0 };

const counterSlice = createSlice({
	name: "counter",
	initialState,
	reducers: {
		incremented(state) {
			state.value = clamp(state.value + 1);
		},
		decremented(state) {
			state.value = clamp(state.value - 1);
		},
		incrementedBy: {
			reducer(state, action: PayloadAction<{ by: number }>) {
				state.value = clamp(state.value + action.payload.by);
			},
			prepare(by: number) {
				// Normalize: round to int, clamp the delta itself so abusers can't pass Infinity.
				const safe = clamp(Math.trunc(by));
				return { payload: { by: safe } };
			},
		},
	},
});

export const { incremented, decremented, incrementedBy } = counterSlice.actions;
export default counterSlice.reducer;

export const selectCount = (s: RootState) => s.counter.value;
export const selectIsMaxed = (s: RootState) =>
	s.counter.value === MAX || s.counter.value === MIN;
