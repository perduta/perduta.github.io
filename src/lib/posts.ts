import type { CollectionEntry } from 'astro:content';

export const POSTS_PER_PAGE = 10;

export type PostEntry = CollectionEntry<'posts'>;

export function sortPosts(posts: PostEntry[]) {
	return [...posts].sort((a, b) => {
		const byDate = b.data.date.valueOf() - a.data.date.valueOf();
		return byDate || a.id.localeCompare(b.id);
	});
}

export function getTotalPages(total: number, perPage = POSTS_PER_PAGE) {
	return Math.max(1, Math.ceil(total / perPage));
}

export function getPagePosts(posts: PostEntry[], page: number, perPage = POSTS_PER_PAGE) {
	const startIndex = (page - 1) * perPage;
	return {
		items: posts.slice(startIndex, startIndex + perPage),
		startIndex,
	};
}

export function getPageHref(page: number) {
	return page <= 1 ? '/' : "/page/" + page + "/";
}
