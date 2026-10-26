import { eq } from 'drizzle-orm';
import { db, schema } from './db';

// Removes the admin-set password so the ADMIN_PASSWORD env var applies again.
await db.delete(schema.settings).where(eq(schema.settings.key, 'admin_password_hash'));
console.log('Admin password reset: ADMIN_PASSWORD from the environment is now active.');
