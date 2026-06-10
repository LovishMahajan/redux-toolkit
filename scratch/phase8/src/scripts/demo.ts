import { store } from "../app";
import { usersApi, __getCallCount, __resetCallCount } from "../features/users";
import { booksApi } from "../features/books";

const fmt = (ms: number) => `${ms.toFixed(2)}ms`;

console.log("── 1. getUsers: fetch + cache hit ──────────────────────────────");
__resetCallCount();
let t = performance.now();
const sub1 = store.dispatch(usersApi.endpoints.getUsers.initiate());
await sub1.unwrap();
console.log(
	`  first  call: ${fmt(performance.now() - t)} (network), queryFn calls = ${__getCallCount()}`,
);

t = performance.now();
const sub2 = store.dispatch(usersApi.endpoints.getUsers.initiate());
await sub2.unwrap();
console.log(
	`  second call: ${fmt(performance.now() - t)} (cache hit), queryFn calls = ${__getCallCount()}`,
);

console.log("\n── 2. select() reads the cache slot ────────────────────────────");
const slot = usersApi.endpoints.getUsers.select()(store.getState());
console.log("  status     :", slot.status);
console.log("  isSuccess  :", slot.isSuccess);
console.log("  data length:", slot.data?.length);
console.log("  requestId  :", slot.requestId);

console.log("\n── 3. parameterized cache slots: u_1 and u_2 are independent ───");
await store.dispatch(usersApi.endpoints.getUserById.initiate("u_1")).unwrap();
await store.dispatch(usersApi.endpoints.getUserById.initiate("u_2")).unwrap();
const u1 = usersApi.endpoints.getUserById.select("u_1")(store.getState());
const u2 = usersApi.endpoints.getUserById.select("u_2")(store.getState());
console.log("  u_1:", u1.data?.name, "/ requestId:", u1.requestId);
console.log("  u_2:", u2.data?.name, "/ requestId:", u2.requestId);
console.log(
	"  different requestIds:",
	u1.requestId !== u2.requestId,
	"(each cache slot is its own fetch)",
);

console.log("\n── 4. Books endpoint shares the same api cache ─────────────────");
await store.dispatch(booksApi.endpoints.getBooks.initiate()).unwrap();
const books = booksApi.endpoints.getBooks.select()(store.getState());
console.log("  books in cache:", books.data?.length);

console.log("\n── 5. State shape: all cache slots live under state.api ────────");
const state = store.getState();
const apiState = state.api as {
	queries: Record<string, unknown>;
	subscriptions: unknown;
};
console.log(
	"  query slots:",
	Object.keys(apiState.queries),
);

console.log("\n── 6. Unsubscribe (kicks off 60s keepUnusedDataFor timer) ──────");
sub1.unsubscribe();
sub2.unsubscribe();
console.log("  released subscriptions; cache still alive (eviction in 60s)");

process.exit(0); // event loop has pending 60s timers; force exit
