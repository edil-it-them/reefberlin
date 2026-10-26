import { db, schema } from './db';

const events = [
	['Reef Night 1', 'Nina Kraviz, Helena Hauff', '2026-03-14', 'Berghain'],
	['Reef Night 2', 'Floating Points, Kiasmos', '2026-04-02', 'Berghain'],
	['Coral Sunday', 'Âme, Dixon', '2026-04-19', 'Berghain'],
	['Low Frequency Club', 'Objekt, Call Super', '2026-05-08', 'Berghain'],
	['Anemone Afterhours', 'Ben Klock, Marcel Dettmann', '2026-05-30', 'Berghain']
] as const;

await db
	.insert(schema.events)
	.values(
		events.map(([name, artists, date, venue]) => ({
			name,
			artists,
			date,
			venue,
			slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
		}))
	)
	.onConflictDoNothing();
console.log(`Seeded ${events.length} events.`);
