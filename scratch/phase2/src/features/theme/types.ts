// Discriminated union — the three theme modes are mutually exclusive.
// `system` carries the OS preference at the moment of selection, so the UI
// can render the *resolved* color without re-reading prefers-color-scheme.
export type ThemeState =
	| { mode: "light" }
	| { mode: "dark" }
	| { mode: "system"; resolved: "light" | "dark" };
