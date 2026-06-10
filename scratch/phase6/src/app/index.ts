// PATTERN B — named re-exports for a *controlled* public API. Anything not
// listed here is an internal of `app/`. If we add a private dev-only logger
// to store.ts later, callers can't reach it through this barrel.
export { store, makeStore } from "./store";
export type { RootState, AppDispatch } from "./store";
