<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let editingId: number | null = $state(null);

	/** Safari keeps the native date popover open after a pick; blur closes it.
	 * Typed edits (keyboard) are left alone so segment entry isn't interrupted. */
	function closePickerOnPick(node: HTMLInputElement) {
		let typed = false;
		const onKeydown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab' && e.key !== 'Escape') typed = true;
		};
		const onChange = () => {
			if (!typed && node.value) node.blur();
			typed = false;
		};
		const onBlur = () => (typed = false);
		node.addEventListener('keydown', onKeydown);
		node.addEventListener('change', onChange);
		node.addEventListener('blur', onBlur);
		return {
			destroy() {
				node.removeEventListener('keydown', onKeydown);
				node.removeEventListener('change', onChange);
				node.removeEventListener('blur', onBlur);
			}
		};
	}
</script>

<svelte:head><title>Admin · Events</title></svelte:head>

{#snippet fields(event?: (typeof data.events)[number])}
	<input name="name" required placeholder="Event name" aria-label="Event name" value={event?.name ?? ''} class="field" />
	<input name="artists" required placeholder="Artists (comma separated)" aria-label="Artists" value={event?.artists ?? ''} class="field" />
	<div class="grid grid-cols-2 gap-2">
		<input name="date" type="date" use:closePickerOnPick required aria-label="Date" value={event?.date ?? ''} class="field" />
		<input name="venue" required placeholder="Venue" aria-label="Venue" value={event?.venue ?? ''} class="field" />
	</div>
{/snippet}

<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Add event</h1>
<form method="POST" action="?/create" use:enhance class="card mb-8 flex flex-col gap-2 p-4">
	{@render fields()}
	{#if form?.error && form.id === null}<p role="alert" class="text-sm text-red-400">{form.error}</p>{/if}
	<div><button class="btn-primary">Add</button></div>
</form>

<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Events ({data.events.length})</h1>
<div class="flex flex-col gap-3">
	{#each data.events as event (event.id)}
		<article class="card p-4">
			{#if editingId === event.id}
				<form
					method="POST"
					action="?/update"
					class="flex flex-col gap-2"
					use:enhance={() => async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') editingId = null;
					}}
				>
					<input type="hidden" name="id" value={event.id} />
					{@render fields(event)}
					{#if form?.error && form.id === event.id}<p role="alert" class="text-sm text-red-400">{form.error}</p>{/if}
					<div class="flex gap-2">
						<button class="btn-primary">Save</button>
						<button type="button" class="btn-ghost" onclick={() => (editingId = null)}>Cancel</button>
					</div>
				</form>
			{:else}
				<p class="font-medium">{event.name}</p>
				<p class="text-sm text-muted">{event.date} · {event.venue} · {event.artists}</p>
				<div class="mt-2 flex gap-2">
					<button type="button" class="btn-ghost" onclick={() => (editingId = event.id)}>Edit</button>
					<form
						method="POST"
						action="?/delete"
						use:enhance={({ cancel }) => {
							if (!confirm(`Delete "${event.name}" and all its comments?`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={event.id} />
						<button class="btn-danger">Delete</button>
					</form>
				</div>
			{/if}
		</article>
	{/each}
</div>
