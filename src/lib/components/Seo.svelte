<script lang="ts">
	import { page } from '$app/state';

	type Props = {
		title: string;
		description: string;
		/** Canonical path (no query string); defaults to the current path. */
		path?: string;
		/** Path or absolute URL of the share image. */
		image?: string;
		imageWidth?: number;
		imageHeight?: number;
		type?: 'website' | 'article';
		noindex?: boolean;
		jsonLd?: Record<string, unknown>;
	};
	let {
		title,
		description,
		path = page.url.pathname,
		image = '/og-default.png',
		imageWidth = 1200,
		imageHeight = 630,
		type = 'website',
		noindex = false,
		jsonLd
	}: Props = $props();

	const SITE = 'Reef Berlin';
	const abs = (p: string) => new URL(p, page.url.origin).href;
	const canonical = $derived(abs(path));
	const imageUrl = $derived(abs(image));
	const fullTitle = $derived(title === SITE ? `${SITE} Guestbook` : `${title} · ${SITE}`);
	const clean = $derived(description.replace(/\s+/g, ' ').trim().slice(0, 200));
	// "<" is escaped so user-supplied text can never close the script tag.
	const jsonLdText = $derived(jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : '');
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={clean} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex, follow" />{/if}

	<meta property="og:site_name" content={SITE} />
	<meta property="og:type" content={type} />
	<meta property="og:locale" content="en_GB" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={clean} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content={String(imageWidth)} />
	<meta property="og:image:height" content={String(imageHeight)} />
	<meta property="og:image:alt" content={title} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={clean} />
	<meta name="twitter:image" content={imageUrl} />

	{#if jsonLd}{@html `<script type="application/ld+json">${jsonLdText}</script>`}{/if}
</svelte:head>
