<script lang="ts">
	import EventCard from '#lib/components/EventCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
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
{:else}
	<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Events</h1>
{/if}

<div class="flex flex-col gap-3">
	{#each data.events as event (event.id)}
		<EventCard {event} commentCount={event.commentCount} linked />
	{:else}
		<p class="card p-6 text-center text-muted">No events found.</p>
	{/each}
</div>
