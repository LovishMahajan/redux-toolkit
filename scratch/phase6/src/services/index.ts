// PATTERN C — namespace re-exports. Both modules export `ApiError`, so a plain
// `export * from "./weatherApi"; export * from "./searchApi"` would fail to
// compile (duplicate identifier). Namespacing gives callers `weatherApi.ApiError`
// vs `searchApi.ApiError` cleanly.
export * as weatherApi from "./weatherApi";
export * as searchApi from "./searchApi";

// Types that are unambiguous (no collision) can also be re-exported flat —
// callers may want to use `Forecast` or `SearchHit` without prefix.
export type { Forecast } from "./weatherApi";
export type { SearchHit } from "./searchApi";
