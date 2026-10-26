import { json } from '@sveltejs/kit';
import { listEvents } from '#lib/server/events.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	if (!q) return json([]);
	const rows = await listEvents(q);
	return json(
		rows.slice(0, 6).map(({ slug, name, artists, venue, date }) => ({
			slug,
			name,
			artists,
			venue,
			date
		}))
	);
};
