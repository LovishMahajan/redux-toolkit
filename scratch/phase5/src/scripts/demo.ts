import { store } from "../app/store";
import {
	incremented,
	credentialsRemembered,
	boom,
} from "../features/explosive";
import { sink } from "../observability";

store.dispatch(incremented());
store.dispatch(incremented());
store.dispatch(credentialsRemembered({ email: "a@b.com", password: "p" }));

console.log("--- counts before crash ---");
console.log(Object.fromEntries(sink.counts));

try {
	store.dispatch(boom({ password: "hunter2" }));
} catch (e) {
	console.log("\n--- dispatch caller caught: ---");
	console.log((e as Error).message);
}

console.log("\n--- crash records (scrubbed) ---");
console.log(
	JSON.stringify(
		sink.crashes.map(({ stack, ...rest }) => rest),
		null,
		2,
	),
);

console.log("\n--- final counts ---");
console.log(Object.fromEntries(sink.counts));
