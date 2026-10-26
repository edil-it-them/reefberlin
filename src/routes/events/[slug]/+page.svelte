<script lang="ts">
	import CommentForm from '#lib/components/CommentForm.svelte';
	import CommentThread from '#lib/components/CommentThread.svelte';
	import EventCard from '#lib/components/EventCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{data.event.name} · Reef Berlin Guestbook</title></svelte:head>

<a href="/" class="mb-3 inline-block text-sm text-link hover:underline">← All events</a>

<EventCard event={data.event} />

<section class="card mt-3 p-4" aria-label="Leave a comment">
	<CommentForm siteKey={data.siteKey} {form} />
</section>

<section class="mt-6 flex flex-col gap-3" aria-label="Comments">
	{#each data.threads as thread (thread.id)}
		<CommentThread {thread} siteKey={data.siteKey} {form} />
	{:else}
		<p class="card p-6 text-center text-muted">No comments yet. Be the first to sign the guestbook!</p>
	{/each}
</section>
