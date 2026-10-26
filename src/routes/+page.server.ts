import { listEvents, SORTS, type Sort } from '#lib/server/events.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const raw = url.searchParams.get('sort');
	const sort: Sort = (SORTS as readonly string[]).includes(raw ?? '') ? (raw as Sort) : 'date';
	return { query, sort, events: await listEvents(query, sort) };
};
