// PATTERN A — re-export everything from each file. The feature folder IS
// the public API; nothing inside is "private".
export * from "./weatherSlice";
export * from "./weatherThunks";
export * from "./types";
// `export *` skips default exports — re-bind explicitly:
export { default as weatherReducer } from "./weatherSlice";
