import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemeState } from "./types";
import type { RootState } from "../../app/store";

// Annotate as the full union — otherwise TS widens to the specific variant
// and rejects reducers that return a different variant. This is the #1 gotcha
// with discriminated-union state.
const initialState = { mode: "system", resolved: "light" } as ThemeState;

const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		// Variant switches return fresh objects (cannot draft-mutate across shapes).
		lightModeSelected() {
			return { mode: "light" as const };
		},
		darkModeSelected() {
			return { mode: "dark" as const };
		},
		systemModeSelected(
			_state,
			action: PayloadAction<{ resolved: "light" | "dark" }>,
		) {
			return { mode: "system" as const, resolved: action.payload.resolved };
		},
	},
});

export const { lightModeSelected, darkModeSelected, systemModeSelected } =
	themeSlice.actions;
export default themeSlice.reducer;

// Selector demonstrates union narrowing — TS proves `resolved` is safe to read.
export const selectEffectiveTheme = (s: RootState): "light" | "dark" =>
	s.theme.mode === "system" ? s.theme.resolved : s.theme.mode;
