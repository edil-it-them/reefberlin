import { listEvents } from '#lib/server/events.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	return { query, events: await listEvents(query) };
};
