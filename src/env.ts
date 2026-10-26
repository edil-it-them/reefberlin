import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: { schema: (value) => value || 'file:local.db' },
	DATABASE_AUTH_TOKEN: { schema: optional },
	/** Initial admin password; the admin can override it from /admin/settings. */
	ADMIN_PASSWORD: { schema: optional },
	/** Signs admin session cookies (>= 32 chars). */
	SESSION_SECRET: { schema: optional },
	TURNSTILE_SECRET_KEY: {},
	PUBLIC_TURNSTILE_SITE_KEY: { public: true }
});
