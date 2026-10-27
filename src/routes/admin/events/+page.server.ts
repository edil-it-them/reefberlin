import { fail } from '@sveltejs/kit';
import {
	createEvent,
	deleteEvent,
	listEventsForAdmin,
	updateEvent,
	type EventInput
} from '#lib/server/events.ts';
import { processPoster } from '#lib/server/posters.ts';
import { LIMITS } from '#lib/shared.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ events: await listEventsForAdmin() });

function parseEvent(data: FormData): EventInput | null {
	const text = (key: string) => String(data.get(key) ?? '').trim();
	const event = {
		name: text('name'),
		artists: text('artists'),
		date: text('date'),
		venue: text('venue'),
		description: text('description')
	};
	const { description, ...required } = event;
	const valid =
		Object.values(required).every(Boolean) &&
		/^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
		description.length <= LIMITS.description.max;
	return valid ? event : null;
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const event = parseEvent(data);
		if (!event) return fail(400, { error: 'Fill in all required fields (description max 1000 characters).', id: null });
		const result = await processPoster(data.get('poster'));
		if (result.error) return fail(400, { error: result.error, id: null });
		await createEvent(event, result.poster);
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const event = parseEvent(data);
		if (!Number.isInteger(id) || !event) return fail(400, { error: 'Fill in all required fields (description max 1000 characters).', id });
		const result = await processPoster(data.get('poster'));
		if (result.error) return fail(400, { error: result.error, id });
		const removePoster = data.get('removePoster') === 'true';
		await updateEvent(id, event, result.poster ?? (removePoster ? null : undefined));
		return { success: true };
	},

	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid event.', id });
		await deleteEvent(id);
		return { success: true };
	}
};
