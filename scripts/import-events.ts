import { readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { and, eq } from 'drizzle-orm';
import { processPoster } from '../src/lib/server/poster-image';
import { LIMITS, eventSlugBase } from '../src/lib/shared';
import { db, schema } from './db';

// Usage: npm run import:events -- [csv] [--posters dir] [--apply] [--remote] [--skip-errors]
// Without --apply nothing is written: the CSV and posters are only checked.
// Required CSV columns: name, artist(s), date (YYYY-MM-DD), venue, description, poster_file.
// --skip-errors: rows with a missing/bad poster are imported without one; rows with other errors are skipped.
// An event counts as already imported when name AND date match, so re-running is safe.

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const option = (f: string) => {
	const i = args.indexOf(f);
	return i >= 0 ? args[i + 1] : undefined;
};
const csvPath = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--posters') ?? 'import/reef events.csv');
const postersDir = resolve(option('--posters') ?? join(dirname(csvPath), 'posters'));
const apply = flag('--apply');
const skipErrors = flag('--skip-errors');

const url = process.env.DATABASE_URL || 'file:local.db';
const remote = !url.startsWith('file:');
if (apply && remote && !flag('--remote')) {
	console.error(`Refusing to write to ${url}. Add --remote to confirm you mean the production database.`);
	process.exit(1);
}

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, commas and line breaks inside quotes. */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
			else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') (row.push(field), (field = ''));
		else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			field = '';
			if (row.some((f) => f.trim())) rows.push(row);
			row = [];
		} else field += c;
	}
	row.push(field);
	if (row.some((f) => f.trim())) rows.push(row);
	return rows;
}

const raw = (await readFile(csvPath, 'utf8')).replace(/^\uFEFF/, '');
const [header, ...lines] = parseCsv(raw);
const col = (...names: string[]) => header.findIndex((h) => names.includes(h.trim().toLowerCase()));
const idx = {
	name: col('name'),
	artists: col('artists', 'artist'),
	date: col('date'),
	venue: col('venue'),
	description: col('description'),
	poster: col('poster_file', 'poster')
};
const missing = Object.entries(idx).filter(([, i]) => i < 0).map(([k]) => k);
if (missing.length) {
	console.error(`CSV is missing column(s): ${missing.join(', ')}. Found: ${header.join(', ')}`);
	process.exit(1);
}

type Row = { line: number; name: string; artists: string; date: string; venue: string; description: string; posterFile: string };
const rows: Row[] = lines.map((r, i) => ({
	line: i + 2,
	name: r[idx.name]?.trim() ?? '',
	artists: r[idx.artists]?.trim() ?? '',
	date: r[idx.date]?.trim() ?? '',
	venue: r[idx.venue]?.trim() ?? '',
	description: r[idx.description]?.trim() ?? '',
	posterFile: r[idx.poster]?.trim() ?? ''
}));

const errors: string[] = [];
/** Lines that must be skipped entirely vs. lines that only lose their poster. */
const badRows = new Set<number>();
const badPosters = new Set<number>();
const warnings: string[] = [];
const seen = new Map<string, number>();
for (const r of rows) {
	const at = `line ${r.line} (${r.name || '?'} ${r.date})`;
	if (!r.name || !r.artists || !r.venue) (errors.push(`${at}: name, artist and venue are required`), badRows.add(r.line));
	if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(r.date))) (errors.push(`${at}: date must be YYYY-MM-DD`), badRows.add(r.line));
	if (r.description.length > LIMITS.description.max) (errors.push(`${at}: description is over ${LIMITS.description.max} characters`), badRows.add(r.line));
	const key = `${r.name.toLowerCase()}|${r.date}`;
	if (seen.has(key)) (errors.push(`${at}: same name and date as line ${seen.get(key)}`), badRows.add(r.line));
	seen.set(key, r.line);
	if (/verify|todo|incomplete|\?\?/i.test(r.artists + r.description)) warnings.push(`${at}: contains a note that looks unfinished: "${r.artists}"`);
}

// Optimize posters up front so problems show in the dry run too.
const posters = new Map<number, Awaited<ReturnType<typeof processPoster>>['poster']>();
for (const r of rows) {
	if (!r.posterFile) {
		warnings.push(`line ${r.line} (${r.name} ${r.date}): no poster_file, event will have no poster`);
		continue;
	}
	let bytes: Buffer;
	try {
		bytes = await readFile(join(postersDir, basename(r.posterFile)));
	} catch {
		errors.push(`line ${r.line} (${r.name} ${r.date}): poster file not found: ${r.posterFile}`);
		badPosters.add(r.line);
		continue;
	}
	const type = /\.png$/i.test(r.posterFile) ? 'image/png' : 'image/jpeg';
	const result = await processPoster(new File([new Uint8Array(bytes)], r.posterFile, { type }));
	if (result.error) (errors.push(`line ${r.line} (${r.name} ${r.date}): ${result.error}`), badPosters.add(r.line));
	else posters.set(r.line, result.poster);
}

console.log(`${apply ? 'IMPORT' : 'DRY RUN'} into ${remote ? url : 'local file ' + url}`);
console.log(`CSV: ${csvPath}\nPosters: ${postersDir}\nRows: ${rows.length}\n`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`ERROR:   ${e}`);
if (errors.length && !skipErrors) {
	console.log(`\n${errors.length} error(s). Nothing was written; fix the CSV or posters, or add --skip-errors.`);
	process.exit(1);
}
if (errors.length) {
	console.log(`\n--skip-errors: skipping ${badRows.size} row(s), importing ${[...badPosters].filter((l) => !badRows.has(l)).length} without a poster.`);
}

let created = 0;
let skipped = 0;
for (const r of rows) {
	if (badRows.has(r.line)) {
		console.log(`SKIPPED (error): line ${r.line} ${r.name} ${r.date}`);
		continue;
	}
	const existing = await db
		.select({ id: schema.events.id })
		.from(schema.events)
		.where(and(eq(schema.events.name, r.name), eq(schema.events.date, r.date)))
		.get();
	if (existing) {
		skipped++;
		console.log(`skip (exists): ${r.date} ${r.name}`);
		continue;
	}
	const base = eventSlugBase(r.name, r.date);
	let slug = base;
	for (let n = 2; await db.select().from(schema.events).where(eq(schema.events.slug, slug)).get(); n++) slug = `${base}-${n}`;
	const poster = posters.get(r.line);
	console.log(`${apply ? 'create' : 'would create'}: ${slug}${poster ? '' : ' (no poster)'}`);
	if (apply) {
		await db.insert(schema.events).values({
			slug,
			name: r.name,
			artists: r.artists,
			date: r.date,
			venue: r.venue,
			description: r.description,
			...(poster ? { poster: poster.data, posterWidth: poster.width, posterHeight: poster.height } : {})
		});
	}
	created++;
}
console.log(`\n${apply ? 'Created' : 'Would create'} ${created}, skipped ${skipped} already present.`);
if (!apply) console.log('Dry run only. Add --apply to write (and --remote for a production database).');
