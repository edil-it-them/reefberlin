import { asc, desc, eq, like, or, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { slugify } from '#lib/shared.ts';
import { db } from './db';
import { comments, events } from './db/schema';
import type { EventPoster } from './posters';

export type EventInput = { name: string; artists: string; date: string; venue: string; description: string };

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

/** Events with their comment counts; optionally filtered by name, artists or venue. */
export const SORTS = ['date', 'oldest', 'rating', 'comments'] as const;
export type Sort = (typeof SORTS)[number];

export async function listEvents(query = '', sort: Sort = 'date') {
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
			description: events.description,
			posterWidth: events.posterWidth,
			posterHeight: events.posterHeight,
			hasPoster: sql<boolean>`${events.poster} is not null`,
			// Cache-busting token: changes whenever the poster bytes change.
			posterVersion: sql<string | null>`case when ${events.poster} is null then null else length(${events.poster}) || hex(substr(${events.poster}, -8)) end`,
			score: events.score,
			// Columns are written out because Drizzle drops table prefixes in single-table selects,
			// which would make `id` resolve to comments.id inside the subquery.
			commentCount: sql<number>`(select count(*) from comments c where c.event_id = events.id)`
		})
		.from(events)
		.where(q ? or(match(events.name), match(events.artists), match(events.venue)) : undefined)
		.orderBy(
			...(sort === 'rating'
				? [desc(events.score), desc(events.date)]
				: sort === 'comments'
					? [sql`(select count(*) from comments c where c.event_id = events.id) desc`, desc(events.date)]
					: sort === 'oldest'
					? [asc(events.date)]
					: [desc(events.date)])
		)
		.limit(100);
}

/** Applies a vote delta (clamped to -2..2, enough to flip a vote) and returns the new score. */
export async function applyVote(slug: string, delta: number) {
	const d = Math.max(-2, Math.min(2, Math.trunc(delta)));
	const [row] = await db
		.update(events)
		.set({ score: sql`${events.score} + ${d}` })
		.where(eq(events.slug, slug))
		.returning({ score: events.score });
	return row?.score ?? null;
}

export const getEventBySlug = (slug: string) =>
	db
		.select({
			id: events.id,
			slug: events.slug,
			name: events.name,
			artists: events.artists,
			date: events.date,
			venue: events.venue,
			description: events.description,
			posterWidth: events.posterWidth,
			posterHeight: events.posterHeight,
			hasPoster: sql<boolean>`${events.poster} is not null`,
			// Cache-busting token: changes whenever the poster bytes change.
			posterVersion: sql<string | null>`case when ${events.poster} is null then null else length(${events.poster}) || hex(substr(${events.poster}, -8)) end`,
			score: events.score
		})
		.from(events)
		.where(eq(events.slug, slug))
		.get();

export const getEventById = (id: number) =>
	db.query.events.findFirst({ where: eq(events.id, id) });

export const listEventsForAdmin = () =>
	db
		.select({
			id: events.id,
			slug: events.slug,
			name: events.name,
			artists: events.artists,
			date: events.date,
			venue: events.venue,
			description: events.description,
			posterWidth: events.posterWidth,
			posterHeight: events.posterHeight,
			hasPoster: sql<boolean>`${events.poster} is not null`,
			// Cache-busting token: changes whenever the poster bytes change.
			posterVersion: sql<string | null>`case when ${events.poster} is null then null else length(${events.poster}) || hex(substr(${events.poster}, -8)) end`
		})
		.from(events)
		.orderBy(asc(events.name));

async function uniqueSlug(name: string, ignoreId?: number): Promise<string> {
	const base = slugify(name) || 'event';
	for (let i = 0; ; i++) {
		const slug = i === 0 ? base : `${base}-${i + 1}`;
		const existing = await db.query.events.findFirst({ where: like(events.slug, slug) });
		if (!existing || existing.id === ignoreId) return slug;
	}
}

export async function createEvent(input: EventInput, poster: EventPoster | null) {
	await db
		.insert(events)
		.values({
			...input,
			slug: await uniqueSlug(input.name),
			...(poster
				? { poster: poster.data, posterWidth: poster.width, posterHeight: poster.height }
				: {})
		});
}

/** Slug is kept stable on edit so shared links don't break. */
export async function updateEvent(id: number, input: EventInput, poster?: EventPoster | null) {
	await db
		.update(events)
		.set({
			...input,
			...(poster === undefined
				? {}
				: poster
					? { poster: poster.data, posterWidth: poster.width, posterHeight: poster.height }
					: { poster: null, posterWidth: null, posterHeight: null })
		})
		.where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
	await db.delete(events).where(eq(events.id, id));
}
