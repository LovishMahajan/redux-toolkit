import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface ExplosiveState {
	value: number;
	lastLogin: { email: string; password: string } | null;
}

const initialState: ExplosiveState = { value: 0, lastLogin: null };

const explosiveSlice = createSlice({
	name: "explosive",
	initialState,
	reducers: {
		incremented(state) {
			state.value += 1;
		},
		// Holds PII intentionally — the crashReporter must scrub before logging.
		credentialsRemembered(
			state,
			action: PayloadAction<{ email: string; password: string }>,
		) {
			state.lastLogin = action.payload;
		},
		// Throws on purpose so we can verify the crashReporter catches reducer errors.
		boom(_state, action: PayloadAction<{ password: string }>) {
			throw new Error("kaboom: " + JSON.stringify(action.payload));
		},
	},
});

export const { incremented, credentialsRemembered, boom } =
	explosiveSlice.actions;
export default explosiveSlice.reducer;

export const selectValue = (s: RootState) => s.explosive.value;
