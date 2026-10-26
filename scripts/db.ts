import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/server/db/schema';

/** Standalone DB handle for CLI scripts (SvelteKit's $env isn't available outside the app). */
export const db = drizzle(
	createClient({
		url: process.env.DATABASE_URL || 'file:local.db',
		authToken: process.env.DATABASE_AUTH_TOKEN || undefined
	}),
	{ schema }
);
export { schema };
