import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User, AuthError } from "./types";
import type { RootState } from "../../app";
import { loginUser } from "./authThunks";

type Resource<T, E> =
  | { status: 'idle' }
  | { status: 'loading' }                                  // first load, nothing to show
  | { status: 'success'; data: T; revalidating: boolean }  // showing data; maybe refetching
  | { status: 'error'; error: E; lastData?: T };

const authSlice = createSlice({
	name: "auth",
	initialState: { status: "anonymous" } as AuthState,
	reducers: {
		// Domain event, past tense. NOT setUser.
		userLoggedIn(
			_state,
			action: PayloadAction<{ user: User; at: string }>,
		) {
			// We RETURN a fresh object instead of draft-mutating, because we're
			// switching between variants of the union. Immer accepts a returned
			// value as the next state (as long as you don't also touch the draft).
			return {
				status: "authenticated",
				user: action.payload.user,
				sessionStartedAt: action.payload.at,
			};
		},
		userLoggedOut() {
			return { status: "anonymous" as const };
		},
	},
	extraReducers: (builder) => {
		builder.addCase(loginUser.pending, () => {
			return { status: "authenticating" };
		});
		builder.addCase(loginUser.fulfilled, (_, action) => {
			return {
				status: "authenticated",
				user: action.payload.user,
				sessionStartedAt: action.payload.at,
			};
		});
		builder.addCase(loginUser.rejected, (_, action) => {
			if (action.meta.aborted) return { status: "anonymous" };
			const error = action.payload ?? {
				code: "unknown",
				message: action.error.message ?? "Login failed",
			};
			return {
				status: "error",
				error,
			};
		});
	},
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticating = (s: RootState) =>
	s.auth.status === "authenticating";
export const selectIsAuthenticated = (s: RootState) =>
	s.auth.status === "authenticated";
export const selectAuthError = (s: RootState): AuthError | null =>
	s.auth.status === "error" ? s.auth.error : null;
export const selectCurrentUser = (s: RootState): User | null =>
	s.auth.status === "authenticated" ? s.auth.user : null;
