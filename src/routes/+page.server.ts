import { listEvents, SORTS, type Sort } from '#lib/server/events.ts';
import { EDGE_CACHE } from '#lib/server/cache.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders, isDataRequest }) => {
	// Client-side navigations (e.g. back from an event after commenting) skip the edge cache.
	if (!isDataRequest) setHeaders(EDGE_CACHE);
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const raw = url.searchParams.get('sort');
	const sort: Sort = (SORTS as readonly string[]).includes(raw ?? '') ? (raw as Sort) : 'date';
	return { query, sort, events: await listEvents(query, sort) };
};
