import { api } from "../../app/api";
import type { Book } from "./types";

const mockBooks: Book[] = [
	{ id: "b_1", title: "Analytical Engine Notes", authorId: "u_1" },
	{ id: "b_2", title: "Compiler History", authorId: "u_2" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Independent injectEndpoints call — both feature apis share api.reducerPath.
// You could write a single `api.injectEndpoints` covering both; splitting per
// feature is the scalable pattern.
export const booksApi = api.injectEndpoints({
	endpoints: (build) => ({
		getBooks: build.query<Book[], void>({
			queryFn: async () => {
				await wait(20);
				return { data: [...mockBooks] };
			},
		}),
	}),
});
