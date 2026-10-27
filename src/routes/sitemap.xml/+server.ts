import { db } from '#lib/server/db/index.ts';
import { events } from '#lib/server/db/schema.ts';
import type { RequestHandler } from './$types';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const GET: RequestHandler = async ({ url }) => {
	const rows = await db.select({ slug: events.slug }).from(events);
	const entries = [
		`<url><loc>${url.origin}/</loc></url>`,
		...rows.map(
			(r) => `<url><loc>${esc(`${url.origin}/events/${r.slug}`)}</loc></url>`
		)
	];
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`,
		{ headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } }
	);
};
