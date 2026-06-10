// Same-shape state — value is always a number in [-100, 100].
// The invariant is enforced in `prepare()`, never trusted from the caller.
export interface CounterState {
	value: number;
}
