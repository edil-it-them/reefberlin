<script lang="ts">
	import { formatDate } from '#lib/shared.ts';

	type Props = {
		event: { slug: string; name: string; artists: string; date: string; venue: string };
		commentCount?: number;
		linked?: boolean;
	};
	let { event, commentCount, linked = false }: Props = $props();
</script>

<svelte:element
	this={linked ? 'a' : 'div'}
	href={linked ? `/events/${event.slug}` : undefined}
	class="card block p-4 {linked ? 'transition-colors hover:border-ink/40 hover:bg-card-hover' : ''}"
>
	<p class="text-xs text-muted">{formatDate(event.date)} · {event.venue}</p>
	<h2 class="mt-1 text-lg font-medium">{event.name}</h2>
	<p class="mt-1 text-sm text-muted">🎧 {event.artists}</p>
	{#if commentCount !== undefined}
		<p class="mt-3 text-xs font-bold text-muted">
			💬 {commentCount}
			{commentCount === 1 ? 'comment' : 'comments'}
		</p>
	{/if}
</svelte:element>
