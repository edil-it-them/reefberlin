import { randomBytes, scrypt } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { db, schema } from './db';

// Test data: a pinned post, events with flags, nicknames with avatars, comments and replies.
// Safe to re-run: existing events (by slug) are skipped, and comments are only added for new events.
// Refuses to touch a remote database unless you pass --remote.

const url = process.env.DATABASE_URL || 'file:local.db';
if (!url.startsWith('file:') && !process.argv.includes('--remote')) {
	console.error(`Refusing to seed ${url}. This is test data; pass --remote if you really mean it.`);
	process.exit(1);
}

// Same format as src/lib/server/auth.ts (salt:key, scrypt) so seeded users work with the real login check.
const hash = (secret: string) =>
	new Promise<string>((resolve, reject) => {
		const salt = randomBytes(16);
		scrypt(secret, salt, 32, (err, key) =>
			err ? reject(err) : resolve(`${salt.toString('hex')}:${key.toString('hex')}`)
		);
	});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Same format as the app: name + date, e.g. reef-night-1-2026-03-14 (the pinned post has no date).
const eventSlug = (e: { name: string; date: string; pinned?: boolean }) =>
	[slugify(e.name).slice(0, 80), e.pinned ? '' : e.date].filter(Boolean).join('-');

/** Every seeded user has the codeword "testtest". */
const CODEWORD = 'testtest';
const users = [
	['Tide', 'octopus'],
	['Kelp', 'seahorse'],
	['Neon', 'jellyfish'],
	['Drift', 'manta_ray'],
	['Pearl', 'nautilus'],
	['Spike', 'starfish'],
	['Moss', 'crab'],
	['Glow', 'anglerfish']
] as const;

type Ev = {
	name: string;
	artists: string;
	date: string;
	venue: string;
	description?: string;
	pinned?: boolean;
	votingDisabled?: boolean;
	sharingDisabled?: boolean;
	score?: number;
	/** [user index, text, optional replies as [user index, text]] */
	comments?: [number, string, [number, string][]?][];
};

const events: Ev[] = [
	{
		name: '10 YEARS OF REEF — NOT ONE PHOTO',
		artists: '',
		date: '2026-10-01',
		venue: '',
		description:
			'Placeholder text. Explain here why there are no photos, what to post (good and bad memories) and how to post (pick an avatar, a nickname and a codeword).',
		pinned: true,
		votingDisabled: true,
		sharingDisabled: true
	},
	{
		name: 'Reef Night 1',
		artists: 'Nina Kraviz, Helena Hauff',
		date: '2026-03-14',
		venue: 'Berghain',
		description: 'The one that started it all. Doors at midnight, out at noon.',
		score: 42,
		comments: [
			[0, 'Still the best floor I have ever been on.', [[1, 'Agreed. The sound was unreal.'], [2, 'I lost my jacket and found it again at 11am.']]],
			[3, 'Queue was long but worth every minute.'],
			[4, 'Bad memory: the cloakroom line. Good memory: everything else.']
		]
	},
	{
		name: 'Reef Night 2',
		artists: 'Floating Points, Kiasmos',
		date: '2026-04-02',
		venue: 'Berghain',
		score: 17,
		comments: [[5, 'That closing set gave me goosebumps.', [[0, 'Same. Never forgot it.']]]]
	},
	{
		name: 'Coral Sunday',
		artists: 'Âme, Dixon',
		date: '2026-04-19',
		venue: 'Berghain',
		description: 'Sunday session with the sun coming through the windows.',
		score: 31,
		votingDisabled: true,
		comments: [
			[6, 'Sunday light on the dancefloor, nothing beats it.'],
			[7, 'Met my best friend here.', [[6, 'Aww. Love this.'], [1, 'This is why we come back.']]]
		]
	},
	{
		name: 'Low Frequency Club',
		artists: 'Objekt, Call Super',
		date: '2026-05-08',
		venue: 'Panorama Bar',
		score: -3,
		sharingDisabled: true,
		comments: [[2, 'Too loud for me, honestly.'], [4, 'Bass you could feel in your teeth.']]
	},
	{
		name: 'Anemone Afterhours',
		artists: 'Ben Klock, Marcel Dettmann',
		date: '2026-05-30',
		venue: 'Berghain',
		score: 8
	},
	{
		name: 'A very long event name to check how the card wraps on narrow phone screens',
		artists: 'Artist One, Artist Two, Artist Three, Artist Four, Artist Five, Artist Six',
		date: '2026-06-12',
		venue: 'Some Venue With A Rather Long Name',
		description:
			'Long description to test clamping. '.repeat(30).trim(),
		score: 0
	}
];

const nickRows = await Promise.all(
	users.map(async ([name, icon]) => ({
		name,
		nameKey: name.toLowerCase(),
		icon,
		codewordHash: await hash(CODEWORD)
	}))
);
await db.insert(schema.nicknames).values(nickRows).onConflictDoNothing();
const nicks = await db
	.select()
	.from(schema.nicknames)
	.where(inArray(schema.nicknames.nameKey, nickRows.map((n) => n.nameKey)));
const nickId = (i: number) => nicks.find((n) => n.nameKey === users[i][0].toLowerCase())!.id;

// Only one post can be pinned, so don't add a second one.
const hasPinned = (await db.select().from(schema.events)).some((e) => e.pinned);
let newEvents = 0;
let newComments = 0;
for (const ev of events) {
	if (ev.pinned && hasPinned) continue;
	const [row] = await db
		.insert(schema.events)
		.values({
			slug: eventSlug(ev),
			name: ev.name,
			artists: ev.artists,
			date: ev.date,
			venue: ev.venue,
			description: ev.description ?? '',
			score: ev.score ?? 0,
			pinned: ev.pinned ?? false,
			votingDisabled: ev.votingDisabled ?? false,
			sharingDisabled: ev.sharingDisabled ?? false
		})
		.onConflictDoNothing()
		.returning({ id: schema.events.id });
	if (!row) continue;
	newEvents++;
	for (const [u, body, replies] of ev.comments ?? []) {
		const [parent] = await db
			.insert(schema.comments)
			.values({ eventId: row.id, nicknameId: nickId(u), body })
			.returning({ id: schema.comments.id });
		newComments++;
		for (const [ru, rbody] of replies ?? []) {
			await db
				.insert(schema.comments)
				.values({ eventId: row.id, parentId: parent.id, nicknameId: nickId(ru), body: rbody });
			newComments++;
		}
	}
}

console.log(
	`Seeded ${newEvents} new events and ${newComments} comments (${users.length} test users, codeword "${CODEWORD}").`
);
