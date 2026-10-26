import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { ADMIN_PASSWORD, SESSION_SECRET } from '$app/env/private';
import { db } from './db';
import { settings } from './db/schema';

const COOKIE = 'admin_session';
const SESSION_SECONDS = 60 * 60 * 8;
const PASSWORD_KEY = 'admin_password_hash';

/* ---------- hashing (used for admin password and nickname codewords) ---------- */

function derive(secret: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) =>
		scrypt(secret, salt, 32, (err, key) => (err ? reject(err) : resolve(key)))
	);
}

export async function hashSecret(secret: string): Promise<string> {
	const salt = randomBytes(16);
	return `${salt.toString('hex')}:${(await derive(secret, salt)).toString('hex')}`;
}

export async function verifySecret(secret: string, stored: string): Promise<boolean> {
	const [saltHex, keyHex] = stored.split(':');
	if (!saltHex || !keyHex) return false;
	const expected = Buffer.from(keyHex, 'hex');
	const actual = await derive(secret, Buffer.from(saltHex, 'hex'));
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ---------- admin password ---------- */

/** Stored hash (set by the admin) takes precedence; otherwise the ADMIN_PASSWORD env var applies. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
	const row = await db.query.settings.findFirst({ where: eq(settings.key, PASSWORD_KEY) });
	if (row) return verifySecret(password, row.value);
	const initial = ADMIN_PASSWORD;
	if (!initial) return false;
	const a = createHmac('sha256', 'cmp').update(password).digest();
	const b = createHmac('sha256', 'cmp').update(initial).digest();
	return timingSafeEqual(a, b);
}

export async function setAdminPassword(password: string): Promise<void> {
	const value = await hashSecret(password);
	await db
		.insert(settings)
		.values({ key: PASSWORD_KEY, value })
		.onConflictDoUpdate({ target: settings.key, set: { value } });
}

/* ---------- admin session (signed, stateless cookie) ---------- */

/** The signing key includes the stored password hash, so changing the password logs everyone out. */
async function signingKey(): Promise<string> {
	const row = await db.query.settings.findFirst({ where: eq(settings.key, PASSWORD_KEY) });
	return `${SESSION_SECRET ?? ''}|${row?.value ?? ''}`;
}

const sign = (payload: string, key: string) =>
	createHmac('sha256', key).update(payload).digest('hex');

export async function startAdminSession(cookies: Cookies): Promise<void> {
	const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
	const payload = String(expires);
	cookies.set(COOKIE, `${payload}.${sign(payload, await signingKey())}`, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_SECONDS
	});
}

export function endAdminSession(cookies: Cookies): void {
	cookies.delete(COOKIE, { path: '/' });
}

export async function isAdminSession(cookies: Cookies): Promise<boolean> {
	if (!SESSION_SECRET || SESSION_SECRET.length < 32) return false;
	const [payload, signature] = (cookies.get(COOKIE) ?? '').split('.');
	if (!payload || !signature) return false;
	const expected = Buffer.from(sign(payload, await signingKey()));
	const given = Buffer.from(signature);
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
	return Number(payload) > Date.now() / 1000;
}
