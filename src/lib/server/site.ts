import { eq, sql } from 'drizzle-orm';
import { DEFAULT_SITE, MAX_RULES, type SiteContent } from '#lib/shared.ts';
import { getBannerVersion } from './banner';
import { db } from './db';
import { comments, events, settings } from './db/schema';

const KEY = 'site_content';

const pct = (v: unknown) => {
	const n = Number(v);
	return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : 50;
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Only http(s) links are allowed. */
export function safeUrl(v: string): string {
	try {
		const u = new URL(v);
		return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
	} catch {
		return '';
	}
}

export function normalizeSite(raw: Partial<Record<keyof SiteContent, unknown>>): SiteContent {
	const rules = (Array.isArray(raw.rules) ? raw.rules : [])
		.map((r) => ({ title: str(r?.title, 60), body: str(r?.body, 300) }))
		.filter((r) => r.title)
		.slice(0, MAX_RULES);
	return {
		bannerUrl: '',
		bannerX: pct(raw.bannerX ?? 50),
		bannerY: pct(raw.bannerY ?? 50),
		tagline: str(raw.tagline, 120),
		description: str(raw.description, 800),
		since: str(raw.since, 4),
		venue: str(raw.venue, 80),
		raUrl: safeUrl(str(raw.raUrl, 500)),
		instagramUrl: safeUrl(str(raw.instagramUrl, 500)),
		howToPost: str(raw.howToPost, 300),
		rules
	};
}

export async function getSiteContent(): Promise<SiteContent> {
	const [row, version] = await Promise.all([
		db.query.settings.findFirst({ where: eq(settings.key, KEY) }),
		getBannerVersion()
	]);
	let site = DEFAULT_SITE;
	try {
		if (row) site = normalizeSite(JSON.parse(row.value));
	} catch {
		// fall back to the placeholder copy
	}
	return { ...site, bannerUrl: version ? `/banner?v=${version}` : '' };
}

export async function saveSiteContent(content: SiteContent) {
	const value = JSON.stringify({ ...content, bannerUrl: '' });
	await db
		.insert(settings)
		.values({ key: KEY, value })
		.onConflictDoUpdate({ target: settings.key, set: { value } });
}

/** Nights = event posts (the pinned post is not a night); Memories = all comments. */
export async function getSiteStats() {
	const [nights] = await db
		.select({ n: sql<number>`count(*)` })
		.from(events)
		.where(eq(events.pinned, false));
	const [memories] = await db
		.select({ n: sql<number>`count(*)` })
		.from(comments)
		.innerJoin(events, eq(comments.eventId, events.id));
	return { nights: nights?.n ?? 0, memories: memories?.n ?? 0 };
}
