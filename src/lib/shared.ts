export const LIMITS = {
	nickname: { min: 2, max: 24 },
	codeword: { min: 4, max: 64 },
	comment: { min: 1, max: 1000 }
} as const;

/** Emoji avatars a visitor can pick when they first claim a nickname. */
export const ICONS = ['🐙', '🦑', '🐠', '🐡', '🦈', '🐢', '🦀', '🪸', '🐚', '🐬', '🦞', '🎧'] as const;

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
