// Demo script — proves the slices work end-to-end in Node, no React needed.
// Run with: pnpm exec tsx src/scripts/demo.ts (from scratch/phase2/)

import { store } from "../app/store";
import {
	incremented,
	decremented,
	incrementedBy,
	selectCount,
	selectIsMaxed,
} from "../features/counter";
import {
	lightModeSelected,
	darkModeSelected,
	systemModeSelected,
	selectEffectiveTheme,
} from "../features/theme";

const log = (label: string) =>
	console.log(
		label,
		JSON.stringify(store.getState()),
		`| count=${selectCount(store.getState())}`,
		`| maxed=${selectIsMaxed(store.getState())}`,
		`| theme=${selectEffectiveTheme(store.getState())}`,
	);

log("initial");

store.dispatch(incremented());
store.dispatch(incremented());
store.dispatch(incremented());
log("after +1+1+1");

store.dispatch(incrementedBy(50));
log("after +50");

store.dispatch(incrementedBy(9999)); // clamped by prepare()
log("after +9999 (clamped)");

store.dispatch(decremented());
log("after -1");

store.dispatch(darkModeSelected());
log("after dark");

store.dispatch(systemModeSelected({ resolved: "dark" }));
log("after system(dark)");

store.dispatch(lightModeSelected());
log("after light");
