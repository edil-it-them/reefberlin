<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon-white.png';
	import SearchBar from '#lib/components/SearchBar.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Reef Berlin Guestbook</title>
</svelte:head>

<header class="sticky top-0 z-10 border-b border-line bg-card">
	<div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
		<a href="/" class="flex shrink-0 items-center gap-2 text-lg font-bold">
			<span class="hidden sm:inline text-3xl">reefit</span>
		</a>
		<SearchBar />
	</div>
</header>

<main class="mx-auto max-w-3xl px-4 py-6">
	{@render children()}
</main>
