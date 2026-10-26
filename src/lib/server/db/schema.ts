import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

export const events = sqliteTable('events', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	artists: text('artists').notNull(),
	/** ISO date, YYYY-MM-DD */
	date: text('date').notNull(),
	venue: text('venue').notNull(),
	description: text('description').notNull().default(''),
	/** Net upvotes minus downvotes. */
	score: integer('score').notNull().default(0),
	createdAt: createdAt()
});

/** Anonymous identities. `nameKey` is the lowercased nickname, used for uniqueness. */
export const nicknames = sqliteTable('nicknames', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	nameKey: text('name_key').notNull().unique(),
	icon: text('icon').notNull(),
	codewordHash: text('codeword_hash').notNull(),
	createdAt: createdAt()
});

export const comments = sqliteTable(
	'comments',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		eventId: integer('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		/** Null for top-level comments. Replies can never be nested deeper than one level. */
		parentId: integer('parent_id').references((): AnySQLiteColumn => comments.id, {
			onDelete: 'cascade'
		}),
		nicknameId: integer('nickname_id')
			.notNull()
			.references(() => nicknames.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		createdAt: createdAt(),
		editedAt: integer('edited_at', { mode: 'timestamp' })
	},
	(t) => [index('comments_event_idx').on(t.eventId), index('comments_parent_idx').on(t.parentId)]
);

/** Key/value store for runtime settings (e.g. the admin password hash). */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});
