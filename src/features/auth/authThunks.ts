// src/features/auth/authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { User, AuthError } from "./types";
import * as authApi from "../../services/authApi";

export const loginUser = createAsyncThunk<
	{ user: User; at: string }, // Returned  — the fulfilled payload
	{ email: string; password: string }, // ThunkArg  — what callers pass
	{ state: RootState; rejectValue: AuthError } // config    — getState() typing + typed rejection
>(
	"auth/loginUser",
	async (creds, { rejectWithValue, signal }) => {
		try {
			const { user } = await authApi.login(creds, { signal });
			return { user, at: new Date().toISOString() }; // → fulfilled
		} catch (e) {
			if (e instanceof authApi.ApiError) {
				// EXPECTED failures → rejectWithValue. Serializable, lands on action.payload, fully typed.
				if (e.status === 401)
					return rejectWithValue({
						code: "invalid_credentials",
						message: "Wrong email or password.",
					});
				if (e.status === 503)
					return rejectWithValue({
						code: "network",
						message: "Service unavailable.",
					});
			}
			throw e; // UNEXPECTED → action.error (a SerializedError). This is a bug, not a domain case.
		}
	},
	{
		// condition: guard/dedupe BEFORE the thunk runs. Returning false cancels it silently
		// (no pending, no rejected — unless you opt into dispatchConditionRejection).
		condition: (_creds, { getState }) =>
			getState().auth.status !== "authenticating",
	},
);
