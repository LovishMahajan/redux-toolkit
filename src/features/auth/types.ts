export interface User {
	id: string;
	email: string;
	displayName: string;
}
export type AuthError =
	| { code: "invalid_credentials"; message: string }
	| { code: "network"; message: string }
	| { code: "unknown"; message: string };

export type AuthState =
	| { status: "anonymous" }
	| { status: "authenticating" }
	| { status: "authenticated"; user: User; sessionStartedAt: string }
	| { status: "error"; error: AuthError };
