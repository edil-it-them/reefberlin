<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIMITS } from '#lib/shared.ts';
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
	<input name="artists" placeholder="Artists (comma separated)" aria-label="Artists" value={event?.artists ?? ''} class="field" />
	<div class="grid grid-cols-2 gap-2">
		<input name="date" type="date" use:closePickerOnPick aria-label="Date" value={event?.date ?? ''} class="field" />
		<input name="venue" placeholder="Venue" aria-label="Venue" value={event?.venue ?? ''} class="field" />
	</div>
	<textarea
		name="description"
		rows="4"
		maxlength={LIMITS.description.max}
		placeholder="Description (optional, max {LIMITS.description.max} characters)"
		aria-label="Description"
		class="field">{event?.description ?? ''}</textarea
	>
	<label class="flex items-start gap-2 text-sm">
		<input name="pinned" type="checkbox" value="true" checked={event?.pinned ?? false} class="mt-1" />
		<span>
			Pin to top of the feed (text only, comments closed). Only one post can be pinned: pinning this one unpins the
			other. Then only the name and description are used; artists, venue, date and poster are optional or ignored.
		</span>
	</label>
	<label class="flex items-start gap-2 text-sm">
		<input name="votingDisabled" type="checkbox" value="true" checked={event?.votingDisabled ?? false} class="mt-1" />
		<span>Turn off voting on this post (hides the vote buttons; existing score is kept but stops changing).</span>
	</label>
	<label class="flex items-start gap-2 text-sm">
		<input name="sharingDisabled" type="checkbox" value="true" checked={event?.sharingDisabled ?? false} class="mt-1" />
		<span>Hide the Share button on this post.</span>
	</label>
	<div class="flex flex-col gap-2">
		<label for="poster-{event?.id ?? 'new'}" class="text-sm font-medium">Event poster (optional)</label>
		<input
			id="poster-{event?.id ?? 'new'}"
			name="poster"
			type="file"
			accept="image/png,image/jpeg"
			aria-describedby="poster-help-{event?.id ?? 'new'}"
			class="field"
		/>
		<p id="poster-help-{event?.id ?? 'new'}" class="text-xs text-muted">
			Event posters only; ignored for the pinned post. PNG or JPEG, up to 3 MB. Posters are automatically resized and optimized for the web.
		</p>
		{#if event?.hasPoster}
			<img
				src="/events/{event.slug}/poster?v={event.posterVersion}"
				alt="Current poster for {event.name}"
				width={event.posterWidth ?? undefined}
				height={event.posterHeight ?? undefined}
				loading="lazy"
				decoding="async"
				class="max-h-64 w-fit rounded-lg object-contain"
			/>
			<label class="flex items-center gap-2 text-sm text-muted">
				<input name="removePoster" type="checkbox" value="true" />
				Remove current poster (unless uploading a replacement)
			</label>
		{/if}
	</div>
{/snippet}

<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Add event</h1>
<form method="POST" action="?/create" enctype="multipart/form-data" use:enhance class="card mb-8 flex flex-col gap-2 p-4">
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
					enctype="multipart/form-data"
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
				<p class="font-medium">
					{event.name}
					{#if event.votingDisabled}<span class="ml-1 rounded-full bg-card-hover px-2 py-0.5 text-xs font-bold text-muted">No voting</span>{/if}
					{#if event.sharingDisabled}<span class="ml-1 rounded-full bg-card-hover px-2 py-0.5 text-xs font-bold text-muted">No share</span>{/if}
					{#if event.pinned}<span class="ml-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-400">Pinned</span>{/if}
				</p>
				<p class="text-sm text-muted">{event.date} · {event.venue} · {event.artists}</p>
				{#if event.description}<p class="mt-1 line-clamp-2 text-sm whitespace-pre-wrap">{event.description}</p>{/if}
				{#if event.hasPoster}
					<img
						src="/events/{event.slug}/poster?v={event.posterVersion}"
						alt="Poster for {event.name}"
						width={event.posterWidth ?? undefined}
						height={event.posterHeight ?? undefined}
						loading="lazy"
						decoding="async"
						class="mt-2 max-h-40 w-fit rounded-lg object-contain"
					/>
				{/if}
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
