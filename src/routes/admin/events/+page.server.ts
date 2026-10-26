import { fail } from '@sveltejs/kit';
import {
	createEvent,
	deleteEvent,
	listEventsForAdmin,
	updateEvent,
	type EventInput
} from '#lib/server/events.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ events: await listEventsForAdmin() });

function parseEvent(data: FormData): EventInput | null {
	const text = (key: string) => String(data.get(key) ?? '').trim();
	const event = { name: text('name'), artists: text('artists'), date: text('date'), venue: text('venue') };
	const valid = Object.values(event).every(Boolean) && /^\d{4}-\d{2}-\d{2}$/.test(event.date);
	return valid ? event : null;
}

export const actions: Actions = {
	create: async ({ request }) => {
		const event = parseEvent(await request.formData());
		if (!event) return fail(400, { error: 'All fields are required.', id: null });
		await createEvent(event);
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const event = parseEvent(data);
		if (!Number.isInteger(id) || !event) return fail(400, { error: 'All fields are required.', id });
		await updateEvent(id, event);
		return { success: true };
	},

	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid event.', id });
		await deleteEvent(id);
		return { success: true };
	}
};
