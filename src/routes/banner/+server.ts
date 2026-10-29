import { error } from '@sveltejs/kit';
import { getBanner } from '#lib/server/banner.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const banner = await getBanner();
	if (!banner) error(404, 'No banner');
	return new Response(new Uint8Array(banner), {
		headers: {
			'content-type': 'image/webp',
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff'
		}
	});
};
