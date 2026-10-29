import sharp from 'sharp';

/** Poster validation and optimization. Kept free of database imports so CLI scripts can use it. */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 500 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export type EventPoster = {
	data: Buffer;
	width: number;
	height: number;
};

export async function processPoster(value: FormDataEntryValue | null) {
	if (value === null || (value instanceof File && value.size === 0)) {
		return { poster: null, error: null };
	}
	if (!(value instanceof File)) {
		return { poster: null, error: 'Choose a PNG or JPEG image.' };
	}
	if (value.size > MAX_UPLOAD_BYTES) {
		return { poster: null, error: 'The image must be 3 MB or smaller.' };
	}
	if (value.type && !['image/png', 'image/jpeg'].includes(value.type)) {
		return { poster: null, error: 'Only PNG and JPEG images are supported.' };
	}

	const input = Buffer.from(await value.arrayBuffer());
	const image = sharp(input, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS });
	let metadata: Awaited<ReturnType<typeof image.metadata>>;
	try {
		metadata = await image.metadata();
	} catch {
		return { poster: null, error: 'The image could not be read. Choose a valid PNG or JPEG.' };
	}
	if (
		(metadata.format !== 'png' && metadata.format !== 'jpeg') ||
		!metadata.width ||
		!metadata.height ||
		metadata.width * metadata.height > MAX_IMAGE_PIXELS
	) {
		return { poster: null, error: 'Only valid PNG and JPEG images up to 40 megapixels are supported.' };
	}

	let width = 1200;
	let height = 1800;
	let quality = 80;
	while (true) {
		const { data, info } = await sharp(input, {
			failOn: 'error',
			limitInputPixels: MAX_IMAGE_PIXELS
		})
			.rotate()
			.resize({ width, height, fit: 'inside', withoutEnlargement: true })
			.webp({ quality, effort: 4 })
			.toBuffer({ resolveWithObject: true });

		if (data.length <= MAX_OUTPUT_BYTES) {
			return {
				poster: { data, width: info.width, height: info.height } satisfies EventPoster,
				error: null
			};
		}
		if (quality > 56) {
			quality -= 8;
		} else if (width > 900) {
			width = 900;
			height = 1350;
			quality = 72;
		} else {
			return {
				poster: null,
				error: 'This image could not be optimized below 500 KB. Choose a smaller image.'
			};
		}
	}
}
