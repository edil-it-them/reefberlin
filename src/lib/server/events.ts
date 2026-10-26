import { asc, desc, eq, like, or, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { slugify } from '#lib/shared.ts';
import { db } from './db';
import { comments, events } from './db/schema';

export type EventInput = { name: string; artists: string; date: string; venue: string };

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

/** Events with their comment counts; optionally filtered by name, artists or venue. */
export async function listEvents(query = '') {
	const q = query.trim();
	const pattern = `%${escapeLike(q)}%`;
	const match = (col: SQLiteColumn) => sql`${col} like ${pattern} escape '\\'`;
	return db
		.select({
			id: events.id,
			slug: events.slug,
			name: events.name,
			artists: events.artists,
			date: events.date,
			venue: events.venue,
			// Columns are written out because Drizzle drops table prefixes in single-table selects,
			// which would make `id` resolve to comments.id inside the subquery.
			commentCount: sql<number>`(select count(*) from comments c where c.event_id = events.id)`
		})
		.from(events)
		.where(q ? or(match(events.name), match(events.artists), match(events.venue)) : undefined)
		.orderBy(desc(events.date))
		.limit(100);
}

export const getEventBySlug = (slug: string) =>
	db.query.events.findFirst({ where: eq(events.slug, slug) });

export const getEventById = (id: number) =>
	db.query.events.findFirst({ where: eq(events.id, id) });

export const listEventsForAdmin = () => db.select().from(events).orderBy(asc(events.name));

async function uniqueSlug(name: string, ignoreId?: number): Promise<string> {
	const base = slugify(name) || 'event';
	for (let i = 0; ; i++) {
		const slug = i === 0 ? base : `${base}-${i + 1}`;
		const existing = await db.query.events.findFirst({ where: like(events.slug, slug) });
		if (!existing || existing.id === ignoreId) return slug;
	}
}

export async function createEvent(input: EventInput) {
	await db.insert(events).values({ ...input, slug: await uniqueSlug(input.name) });
}

/** Slug is kept stable on edit so shared links don't break. */
export async function updateEvent(id: number, input: EventInput) {
	await db.update(events).set(input).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
	await db.delete(events).where(eq(events.id, id));
}
