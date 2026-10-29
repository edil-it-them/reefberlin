import { error, json } from '@sveltejs/kit';
import { applyVote } from '#lib/server/events.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const slug = typeof body?.slug === 'string' ? body.slug : '';
	const delta = Number(body?.delta);
	if (!slug || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 2) error(400, 'Bad vote');
	const score = await applyVote(slug, delta);
	if (score === null) error(404, 'Event not found or voting is closed');
	return json({ score });
};
