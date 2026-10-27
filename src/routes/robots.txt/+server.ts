import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) =>
	new Response(
		`User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${url.origin}/sitemap.xml\n`,
		{ headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=3600' } }
	);
