import type { SearchHit } from "../../services";

export interface SearchState {
	query: string;
	results: SearchHit[];
	status: "idle" | "loading" | "success" | "error";
}
