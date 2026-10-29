import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from './db';
import { settings } from './db/schema';

const KEY = 'site_banner';
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 500 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
// The uncropped image is stored so the admin can move the crop later without re-uploading.
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

/** Scales down to at most 1920 × 1080 and re-encodes as WebP under 500 KB; cropping happens in CSS. */
export async function processBanner(value: FormDataEntryValue | null) {
	if (value === null || (value instanceof File && value.size === 0)) return { banner: null, error: null };
	if (!(value instanceof File)) return { banner: null, error: 'Choose a PNG or JPEG image.' };
	if (value.size > MAX_UPLOAD_BYTES) return { banner: null, error: 'The image must be 3 MB or smaller.' };
	if (value.type && !['image/png', 'image/jpeg'].includes(value.type)) {
		return { banner: null, error: 'Only PNG and JPEG images are supported.' };
	}

	const input = Buffer.from(await value.arrayBuffer());
	try {
		const { format } = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
		if (format !== 'png' && format !== 'jpeg') throw new Error('format');
		for (let quality = 80; quality >= 40; quality -= 8) {
			const data = await sharp(input, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS })
				.rotate()
				.resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
				.webp({ quality, effort: 4 })
				.toBuffer();
			if (data.length <= MAX_OUTPUT_BYTES) return { banner: data, error: null };
		}
		return { banner: null, error: 'This image could not be optimized below 500 KB. Choose a simpler image.' };
	} catch {
		return { banner: null, error: 'The image could not be read. Choose a valid PNG or JPEG.' };
	}
}

export async function saveBanner(data: Buffer | null) {
	if (!data) {
		await db.delete(settings).where(eq(settings.key, KEY));
		return;
	}
	const value = data.toString('base64');
	await db.insert(settings).values({ key: KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getBanner() {
	const row = await db.query.settings.findFirst({ where: eq(settings.key, KEY) });
	return row ? Buffer.from(row.value, 'base64') : null;
}

/** Short cache-busting token, or null when no banner is uploaded. */
export async function getBannerVersion() {
	const banner = await getBanner();
	return banner ? `${banner.length}${banner.subarray(-8).toString('hex')}` : null;
}
