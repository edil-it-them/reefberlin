import { fail } from '@sveltejs/kit';
import { DEFAULT_SITE, MAX_RULES } from '#lib/shared.ts';
import { processBanner, saveBanner } from '#lib/server/banner.ts';
import { getSiteContent, normalizeSite, saveSiteContent } from '#lib/server/site.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ site: await getSiteContent(), maxRules: MAX_RULES });

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const text = (key: string) => String(data.get(key) ?? '');
		const rules = Array.from({ length: MAX_RULES }, (_, i) => ({
			title: text(`rule-title-${i}`),
			body: text(`rule-body-${i}`)
		}));
		const content = normalizeSite({
			bannerX: text('bannerX'),
			bannerY: text('bannerY'),
			tagline: text('tagline'),
			description: text('description'),
			since: text('since'),
			venue: text('venue'),
			raUrl: text('raUrl'),
			instagramUrl: text('instagramUrl'),
			howToPost: text('howToPost'),
			rules
		});
		// Links that were typed but rejected (not http/https) would silently vanish; tell the admin.
		for (const [key, label] of [
			['raUrl', 'Resident Advisor'],
			['instagramUrl', 'Instagram']
		] as const) {
			if (text(key).trim() && !content[key]) {
				return fail(400, { error: `${label} link must start with https:// (or http://).` });
			}
		}
		const upload = await processBanner(data.get('banner'));
		if (upload.error) return fail(400, { error: upload.error });
		await saveSiteContent(content);
		if (upload.banner) await saveBanner(upload.banner);
		else if (data.get('removeBanner') === 'true') await saveBanner(null);
		return { success: true };
	},

	reset: async () => {
		await saveSiteContent(DEFAULT_SITE);
		return { success: true };
	}
};
