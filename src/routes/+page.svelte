<script lang="ts">
	import EventCard from '#lib/components/EventCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const OPTIONS = [
		{ value: 'date', label: 'Newest' },
		{ value: 'oldest', label: 'Oldest' },
		{ value: 'rating', label: 'Top rated' },
		{ value: 'comments', label: 'Most comments' }
	] as const;

	let open = $state(false);
	const current = $derived(OPTIONS.find((o) => o.value === data.sort) ?? OPTIONS[0]);

	function href(sort: string) {
		const p = new URLSearchParams();
		if (data.query) p.set('q', data.query);
		if (sort !== 'date') p.set('sort', sort);
		const qs = p.toString();
		return qs ? `/?${qs}` : '/';
	}
</script>

<svelte:head>
	<title>Reef Berlin Guestbook</title>
</svelte:head>
{#if data.query}
	<h1 class="mb-4 text-sm text-muted">
		{data.events.length} result{data.events.length === 1 ? '' : 's'} for
		<span class="text-ink">“{data.query}”</span>
		· <a href="/" class="text-link hover:underline">clear</a>
	</h1>
{/if}

<svelte:window onclick={() => (open = false)} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative mb-3">
	<button
		type="button"
		aria-expanded={open}
		aria-haspopup="true"
		aria-label="Sort by: {current.label}"
		class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-bold text-muted transition-colors hover:bg-card-hover {open ? 'bg-card-hover' : ''}"
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}
	>
		{current.label}
		<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 13.7a.897.897 0 0 1-.636-.264l-4.6-4.6a.9.9 0 1 1 1.272-1.273L10 11.526l3.964-3.963a.9.9 0 0 1 1.272 1.273l-4.6 4.6A.897.897 0 0 1 10 13.7Z" /></svg>
	</button>
	{#if open}
		<ul class="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-md border border-line bg-card py-1 shadow-lg">
			<li class="px-3 py-1.5 text-xs font-bold text-muted">Sort by</li>
			{#each OPTIONS as o (o.value)}
				<li>
					<a
						href={href(o.value)}
						data-sveltekit-noscroll
						class="block px-3 py-2 text-sm hover:bg-card-hover {o.value === data.sort ? 'bg-card-hover font-bold' : ''}"
					>
						{o.label}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<div class="flex flex-col gap-3">
	{#each data.events as event (event.id)}
		<EventCard {event} commentCount={event.commentCount} linked />
	{:else}
		<p class="card p-6 text-center text-muted">No events found.</p>
	{/each}
</div>
