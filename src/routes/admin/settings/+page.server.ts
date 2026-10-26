import { fail } from '@sveltejs/kit';
import { setAdminPassword, startAdminSession, verifyAdminPassword } from '#lib/server/auth.ts';
import type { Actions } from './$types';

const MIN_LENGTH = 10;

export const actions: Actions = {
	password: async ({ request, cookies }) => {
		const data = await request.formData();
		const current = String(data.get('current') ?? '');
		const next = String(data.get('next') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!(await verifyAdminPassword(current))) return fail(400, { error: 'Current password is wrong.' });
		if (next.length < MIN_LENGTH) return fail(400, { error: `New password must be at least ${MIN_LENGTH} characters.` });
		if (next !== confirm) return fail(400, { error: 'Passwords do not match.' });

		await setAdminPassword(next);
		// Session signing depends on the password hash, so issue a fresh session.
		await startAdminSession(cookies);
		return { success: true };
	}
};
