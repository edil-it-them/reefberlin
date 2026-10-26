import { TURNSTILE_SECRET_KEY } from '$app/env/private';
import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';

export { PUBLIC_TURNSTILE_SITE_KEY };

/** Verifies a Cloudflare Turnstile token. Fails closed on any error. */
export async function verifyCaptcha(token: string | null, ip?: string): Promise<boolean> {
	if (!token) return false;
	const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
	if (ip) body.set('remoteip', ip);
	try {
		const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body
		});
		const data = (await res.json()) as { success?: boolean };
		return data.success === true;
	} catch {
		return false;
	}
}
