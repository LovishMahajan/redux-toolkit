// Visual demo of the debounce. Watch how 5 rapid keystrokes produce ONE API call.
import { store } from "../app/store";
import "../app/listeners"; // register the listener (side-effect import)
import { queryChanged } from "../features/search";
import { __getCallCount } from "../services/searchApi";

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log("typing 5 chars rapidly...");
store.dispatch(queryChanged("c"));
store.dispatch(queryChanged("ca"));
store.dispatch(queryChanged("cat"));
store.dispatch(queryChanged("cats"));
store.dispatch(queryChanged("catsy"));

await tick(100);
console.log("after 100ms — API calls:", __getCallCount(), "(debounce still pending)");

await tick(400);
console.log("after 500ms — API calls:", __getCallCount(), "← should be 1");
console.log("final state:", JSON.stringify(store.getState(), null, 2));
