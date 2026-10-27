/** Cached at Vercel's CDN only; browsers always revalidate so a user never sees a stale view of their own changes. */
export const EDGE_CACHE = {
	'cache-control': 'public, max-age=0, must-revalidate',
	'vercel-cdn-cache-control': 's-maxage=30, stale-while-revalidate=300'
} as const;
