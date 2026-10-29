import { error, fail } from '@sveltejs/kit';
import { verifyCaptcha, PUBLIC_TURNSTILE_SITE_KEY } from '#lib/server/captcha.ts';
import { addComment, getThreads, validateCommentFields } from '#lib/server/comments.ts';
import { EDGE_CACHE } from '#lib/server/cache.ts';
import { getEventBySlug } from '#lib/server/events.ts';
import { AVATARS } from '#lib/shared.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders, isDataRequest }) => {
	const event = await getEventBySlug(params.slug);
	if (!event) error(404, 'Event not found');
	// Only full page loads are edge-cached; client-side data refetches (e.g. after posting a
	// comment) must be fresh so users see their own comment immediately.
	if (!isDataRequest) {
		setHeaders(EDGE_CACHE);
	}
	return { event, threads: await getThreads(event.id), siteKey: PUBLIC_TURNSTILE_SITE_KEY };
};

export const actions: Actions = {
	comment: async ({ request, params, getClientAddress }) => {
		const data = await request.formData();
		const text = (key: string) => String(data.get(key) ?? '').trim();

		const rawParent = text('parentId');
		const parentId = rawParent ? Number(rawParent) : null;
		const values = { nickname: text('nickname'), icon: text('icon'), body: text('body') };
		const reject = (message: string) => fail(400, { error: message, parentId, values });

		const event = await getEventBySlug(params.slug);
		if (!event) error(404, 'Event not found');
		if (event.pinned) return reject('Comments are closed on this post.');

		if (parentId !== null && !Number.isInteger(parentId)) return reject('Invalid reply target.');
		const invalid = validateCommentFields({ ...values, codeword: String(data.get('codeword') ?? '') });
		if (invalid) return reject(invalid);
		if (!(AVATARS as readonly string[]).includes(values.icon)) return reject('Pick an avatar.');

		if (!(await verifyCaptcha(text('cf-turnstile-response'), getClientAddress()))) {
			return reject('Captcha failed. Please try again.');
		}

		const result = await addComment({
			eventId: event.id,
			parentId,
			nickname: values.nickname,
			codeword: String(data.get('codeword')),
			icon: values.icon,
			body: values.body
		});
		if (result.error) return reject(result.error);
		return { success: true };
	}
};
