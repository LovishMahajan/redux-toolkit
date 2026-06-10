// Recursive PII scrub. Mirrors the repo's pattern. Add keys to SENSITIVE as needed.
const SENSITIVE = new Set([
	"password",
	"token",
	"accesstoken",
	"refreshtoken",
	"authorization",
	"email",
	"ssn",
	"creditcard",
]);

export function scrub(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(scrub);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([k, v]) =>
				SENSITIVE.has(k.toLowerCase()) ? [k, "[redacted]"] : [k, scrub(v)],
			),
		);
	}
	return value;
}
