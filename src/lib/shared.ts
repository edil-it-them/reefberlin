export const LIMITS = {
	nickname: { min: 2, max: 24 },
	codeword: { min: 4, max: 64 },
	comment: { min: 1, max: 1000 },
	description: { max: 3000 }
} as const;

/** Designed avatars a visitor can pick; each id is a file in static/avatars/<id>.webp. */
export const AVATARS = [
	'anglerfish',
	'crab',
	'jellyfish',
	'manta_ray',
	'nautilus',
	'nudibranch',
	'octopus',
	'sea_anemone',
	'seahorse',
	'shrimp',
	'squid',
	'starfish'
] as const;

export const NICKNAME_PATTERN = /^[\p{L}\p{N}_.\- ]+$/u;

export function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(date: Date): string {
	const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
	const units: [string, number][] = [
		['y', 31536000],
		['mo', 2592000],
		['d', 86400],
		['h', 3600],
		['m', 60]
	];
	for (const [label, size] of units) {
		if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
	}
	return 'just now';
}

export type SiteRule = { title: string; body: string };

/** Admin-editable copy for the community header, About panel and rules card. */
export type SiteContent = {
	bannerUrl: string;
	/** Crop focus in percent (0-100): which part of the image stays visible in the wide strip. */
	bannerX: number;
	bannerY: number;
	tagline: string;
	description: string;
	since: string;
	venue: string;
	raUrl: string;
	instagramUrl: string;
	howToPost: string;
	rules: SiteRule[];
};

export const MAX_RULES = 8;

/** Placeholder copy, shown until the admin writes the real text in /admin/site. */
export const DEFAULT_SITE: SiteContent = {
	bannerUrl: '',
	bannerX: 50,
	bannerY: 50,
	tagline: 'Ten years of nights. Tell us yours.',
	description:
		'REEF is a Berlin club night. This guestbook collects the memories of the people who danced there: good ones, bad ones, and everything in between.',
	since: '2016',
	venue: 'Berlin',
	raUrl: '',
	instagramUrl: '',
	howToPost: 'Pick an avatar, a nickname and a codeword, then share your memory under any night.',
	rules: [
		{ title: 'Be kind', body: 'Treat everyone in the thread the way you would on the dance floor.' },
		{ title: 'No real names', body: 'Use nicknames only; do not name or identify other people.' },
		{ title: 'Floor stays vague', body: 'No photos and no details that could out someone on the floor.' },
		{ title: 'Memories only', body: 'Stick to your memories of the night: no ads or spam.' }
	]
};
