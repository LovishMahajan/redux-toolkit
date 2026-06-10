export interface CrashRecord {
	action: string;
	message: string;
	ts: string;
}

export const sink = {
	crashes: [] as CrashRecord[],
	reset() {
		this.crashes = [];
	},
};
