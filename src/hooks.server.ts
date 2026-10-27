import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { isAdminSession } from '#lib/server/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');

	event.locals.isAdmin = isAdminArea ? await isAdminSession(event.cookies) : false;

	if (isAdminArea && !event.locals.isAdmin && pathname !== '/admin/login') {
		redirect(303, '/admin/login');
	}

	const response = await resolve(event);
	if (isAdminArea) {
		response.headers.set('cache-control', 'no-store');
		response.headers.set('x-robots-tag', 'noindex, nofollow');
	}
	return response;
};
