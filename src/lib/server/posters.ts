import { eq } from 'drizzle-orm';
import { db } from './db';
import { events } from './db/schema';

export { processPoster, type EventPoster } from './poster-image';

export async function getPosterBySlug(slug: string) {
	const [event] = await db
		.select({ poster: events.poster })
		.from(events)
		.where(eq(events.slug, slug))
		.limit(1);
	return event?.poster ?? null;
}
