import { fail } from '@sveltejs/kit';
import { deleteNickname, listNicknames } from '#lib/server/comments.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ users: await listNicknames() });

export const actions: Actions = {
	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid user.', id });
		await deleteNickname(id);
		return { success: true };
	}
};
