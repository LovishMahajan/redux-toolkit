import type { SearchHit } from "../../services/searchApi";

// The slice holds BOTH the in-flight query AND the result.
// The query is what the user typed (synchronous, every keystroke).
// The result is what the listener wrote back from the network.
export interface SearchState {
	query: string;
	results: SearchHit[];
	status: "idle" | "loading" | "success" | "error";
	error: string | null;
}
