<script lang="ts">
	import { enhance } from '$app/forms';
	import CommentItem from '#lib/components/CommentItem.svelte';
	import { LIMITS } from '#lib/shared.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let editingId: number | null = $state(null);
</script>

<svelte:head><title>Admin · Comments</title></svelte:head>

<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
	Latest comments ({data.comments.length})
</h1>

<div class="flex flex-col gap-3">
	{#each data.comments as comment (comment.id)}
		<article class="card p-4">
			<p class="mb-2 text-xs text-muted">
				on <a class="text-link hover:underline" href="/events/{comment.eventSlug}">{comment.eventName}</a>
				{#if comment.parentId}· reply{/if}
			</p>

			<CommentItem {comment}>
				{#snippet actions()}
					{#if editingId === comment.id}
						<form
							method="POST"
							action="?/update"
							class="mt-2 flex flex-col gap-2"
							use:enhance={() => async ({ result, update }) => {
								await update({ reset: false });
								if (result.type === 'success') editingId = null;
							}}
						>
							<input type="hidden" name="id" value={comment.id} />
							<textarea name="body" rows="3" maxlength={LIMITS.comment.max} class="field">{comment.body}</textarea>
							{#if form?.error && form.id === comment.id}
								<p role="alert" class="text-sm text-red-400">{form.error}</p>
							{/if}
							<div class="flex gap-2">
								<button class="btn-primary">Save</button>
								<button type="button" class="btn-ghost" onclick={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					{:else}
						<div class="mt-2 flex gap-2">
							<button type="button" class="btn-ghost" onclick={() => (editingId = comment.id)}>Edit</button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									const msg = comment.parentId ? 'Delete this reply?' : 'Delete this comment and all its replies?';
									if (!confirm(msg)) cancel();
								}}
							>
								<input type="hidden" name="id" value={comment.id} />
								<button class="btn-danger">Delete</button>
							</form>
						</div>
					{/if}
				{/snippet}
			</CommentItem>
		</article>
	{:else}
		<p class="card p-6 text-center text-muted">No comments yet.</p>
	{/each}
</div>
