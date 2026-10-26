import { fail, redirect } from '@sveltejs/kit';
import { endAdminSession } from '#lib/server/auth.ts';
import { deleteComment, listAllComments, updateCommentBody } from '#lib/server/comments.ts';
import { LIMITS } from '#lib/shared.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ comments: await listAllComments() });

export const actions: Actions = {
	logout: ({ cookies }) => {
		endAdminSession(cookies);
		redirect(303, '/admin/login');
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const body = String(data.get('body') ?? '').trim();
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid comment.', id });
		if (body.length < LIMITS.comment.min || body.length > LIMITS.comment.max)
			return fail(400, { error: `Comment must be ${LIMITS.comment.min}-${LIMITS.comment.max} characters.`, id });
		await updateCommentBody(id, body);
		return { success: true };
	},

	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid comment.', id });
		await deleteComment(id);
		return { success: true };
	}
};
