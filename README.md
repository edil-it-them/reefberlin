# Reef Berlin Guestbook

Anonymous guestbook for events. SvelteKit 3 + Tailwind 4 + Drizzle (libSQL/SQLite), deployed on Vercel.

## Features
- Home: event list with comment counts, top-bar search (name / artists / venue).
- Event page: comments and replies (one level only), protected by Cloudflare Turnstile.
- Admin event editor: optional PNG/JPEG posters, resized and converted to WebP (up to 1200×1800 and 500 KB) before storage in Turso.
- No accounts: a visitor claims a **nickname + codeword** on first post (stored hashed). The same pair is required to reuse the nickname.
- `/admin`: edit/delete comments, manage events, change password.

## Structure
```
src/env.ts                 typed env vars
src/hooks.server.ts        guards /admin/*
src/lib/shared.ts          constants + formatting helpers (client + server)
src/lib/server/            db schema, auth, captcha, events + comments queries
src/lib/components/        UI components
src/routes/                pages (/, /events/[slug], /admin/*)
scripts/                   seed + admin password reset
```

## Local setup
```sh
cp .env.example .env   # then set SESSION_SECRET (openssl rand -hex 32) and ADMIN_PASSWORD
npm install
npm run db:push        # create tables in local.db
npm run db:seed        # sample events
npm run dev
```
The `.env.example` Turnstile keys are Cloudflare's test keys (always pass).

## Deploy to Vercel
1. Create a [Turso](https://turso.tech) database (Vercel's filesystem is read-only, so a local file won't work). Run `DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:push`.
   For an existing database, run the same command after schema changes and before deploying; event posters use new nullable columns.
2. Create a Turnstile widget at Cloudflare.
3. Set these env vars in Vercel: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## Admin password
`ADMIN_PASSWORD` is the initial password. After the admin changes it at `/admin/settings`, a hash in the DB takes over (and all sessions are logged out). If it's forgotten, the developer runs `npm run admin:reset` (against the production DB env vars) to fall back to `ADMIN_PASSWORD`.
