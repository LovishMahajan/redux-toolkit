export interface Post {
	id: string;
	authorId: string;
	title: string;
	body: string;
	createdAt: string; // ISO — used by sortComparer + eviction recency
}
