import { error } from '@sveltejs/kit';
import { getPosterBySlug } from '#lib/server/posters.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const poster = await getPosterBySlug(params.slug);
	if (!poster) error(404, 'Poster not found');

	return new Response(new Uint8Array(poster), {
		headers: {
			'content-type': 'image/webp',
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff'
		}
	});
};
