import { fail, redirect } from '@sveltejs/kit';
import { startAdminSession, verifyAdminPassword } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.isAdmin) redirect(303, '/admin');
};

// Naive per-instance throttle against password guessing; Vercel instances are ephemeral, so this is best-effort.
const failures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const now = Date.now();
		const entry = failures.get(ip);
		if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
			return fail(429, { error: 'Too many attempts. Try again later.' });
		}

		const password = String((await request.formData()).get('password') ?? '');
		if (!(await verifyAdminPassword(password))) {
			const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
			failures.set(ip, { ...current, count: current.count + 1 });
			return fail(400, { error: 'Wrong password.' });
		}

		failures.delete(ip);
		await startAdminSession(cookies);
		redirect(303, '/admin');
	}
};
