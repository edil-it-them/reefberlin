import { asc, desc, eq, and, isNull, sql } from 'drizzle-orm';
import { LIMITS, NICKNAME_PATTERN } from '#lib/shared.ts';
import { hashSecret, verifySecret } from './auth';
import { db } from './db';
import { comments, events, nicknames } from './db/schema';

export type CommentView = {
	id: number;
	parentId: number | null;
	body: string;
	createdAt: Date;
	editedAt: Date | null;
	author: string;
	icon: string;
};
export type Thread = CommentView & { replies: CommentView[] };

const commentColumns = {
	id: comments.id,
	parentId: comments.parentId,
	body: comments.body,
	createdAt: comments.createdAt,
	editedAt: comments.editedAt,
	author: nicknames.name,
	icon: nicknames.icon
};

/** Top-level comments (newest first), each with its replies (oldest first). */
export async function getThreads(eventId: number): Promise<Thread[]> {
	const rows = await db
		.select(commentColumns)
		.from(comments)
		.innerJoin(nicknames, eq(comments.nicknameId, nicknames.id))
		.where(eq(comments.eventId, eventId))
		.orderBy(asc(comments.createdAt), asc(comments.id));

	const threads = new Map<number, Thread>();
	for (const row of rows) if (row.parentId === null) threads.set(row.id, { ...row, replies: [] });
	for (const row of rows) if (row.parentId !== null) threads.get(row.parentId)?.replies.push(row);
	return [...threads.values()].reverse();
}

export type NewComment = {
	eventId: number;
	parentId: number | null;
	nickname: string;
	codeword: string;
	icon: string;
	body: string;
};

/**
 * Posts a comment. The nickname is claimed on first use (bound to its codeword);
 * afterwards the same codeword is required to post under it.
 */
export async function addComment(input: NewComment): Promise<{ error?: string }> {
	if (input.parentId !== null) {
		const parent = await db.query.comments.findFirst({
			where: and(eq(comments.id, input.parentId), eq(comments.eventId, input.eventId), isNull(comments.parentId))
		});
		if (!parent) return { error: 'You can only reply to a top-level comment.' };
	}

	const nameKey = input.nickname.toLowerCase();
	let nick = await db.query.nicknames.findFirst({ where: eq(nicknames.nameKey, nameKey) });
	if (nick) {
		if (!(await verifySecret(input.codeword, nick.codewordHash))) {
			return { error: 'That nickname is taken and the codeword does not match.' };
		}
	} else {
		const [created] = await db
			.insert(nicknames)
			.values({
				name: input.nickname,
				nameKey,
				icon: input.icon,
				codewordHash: await hashSecret(input.codeword)
			})
			.onConflictDoNothing()
			.returning();
		if (!created) return { error: 'That nickname was just taken. Try another.' };
		nick = created;
	}

	await db.insert(comments).values({
		eventId: input.eventId,
		parentId: input.parentId,
		nicknameId: nick.id,
		body: input.body
	});
	return {};
}

/** Validates the user-supplied fields of a comment form. Returns an error message or null. */
export function validateCommentFields(f: { nickname: string; codeword: string; body: string }) {
	const { nickname, codeword, comment } = LIMITS;
	if (f.nickname.length < nickname.min || f.nickname.length > nickname.max)
		return `Nickname must be ${nickname.min}-${nickname.max} characters.`;
	if (!NICKNAME_PATTERN.test(f.nickname))
		return 'Nickname may only contain letters, numbers, spaces and _ . -';
	if (f.codeword.length < codeword.min || f.codeword.length > codeword.max)
		return `Codeword must be ${codeword.min}-${codeword.max} characters.`;
	if (f.body.length < comment.min || f.body.length > comment.max)
		return `Comment must be ${comment.min}-${comment.max} characters.`;
	return null;
}

/* ---------- admin ---------- */

export const listAllComments = () =>
	db
		.select({ ...commentColumns, eventName: events.name, eventSlug: events.slug })
		.from(comments)
		.innerJoin(nicknames, eq(comments.nicknameId, nicknames.id))
		.innerJoin(events, eq(comments.eventId, events.id))
		.orderBy(desc(comments.createdAt), desc(comments.id))
		.limit(200);

export async function updateCommentBody(id: number, body: string) {
	await db.update(comments).set({ body, editedAt: new Date() }).where(eq(comments.id, id));
}

/** Replies are removed with their parent (ON DELETE CASCADE). */
export async function deleteComment(id: number) {
	await db.delete(comments).where(eq(comments.id, id));
}

export const listNicknames = () =>
	db
		.select({
			id: nicknames.id,
			name: nicknames.name,
			icon: nicknames.icon,
			createdAt: nicknames.createdAt,
			commentCount: sql<number>`(select count(*) from comments c where c.nickname_id = nicknames.id)`
		})
		.from(nicknames)
		.orderBy(desc(nicknames.createdAt), desc(nicknames.id));

/** Removes the nickname and, via ON DELETE CASCADE, all of its comments and replies. The name becomes free to claim again. */
export async function deleteNickname(id: number) {
	await db.delete(nicknames).where(eq(nicknames.id, id));
}
