// Both modules export `ApiError`; namespace re-exports keep them callable as
// `authApi.login(...)` / `cartApi.persistCart(...)` and avoid the name collision.
export * as authApi from "./authApi";
export * as cartApi from "./cartApi";
