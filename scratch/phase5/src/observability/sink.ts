export interface CrashRecord {
	action: string;
	payload: unknown; // scrubbed
	message: string;
	stack: string | null;
	ts: string;
}

export interface ActionCountSample {
	type: string;
	count: number;
}

export const sink = {
	crashes: [] as CrashRecord[],
	counts: new Map<string, number>(),
	reset() {
		this.crashes = [];
		this.counts = new Map();
	},
};
