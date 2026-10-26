<script lang="ts">
	import CommentForm from '#lib/components/CommentForm.svelte';
	import CommentItem from '#lib/components/CommentItem.svelte';
	import type { Thread } from '#lib/server/comments.ts';

	type Props = {
		thread: Thread;
		siteKey: string;
		form?: { error?: string; parentId?: number | null; values?: Record<string, string> } | null;
	};
	let { thread, siteKey, form = null }: Props = $props();

	// Re-open the reply form if a failed (no-JS) submission targeted this thread; initial value is intended.
	// svelte-ignore state_referenced_locally
	let replying = $state(form?.parentId === thread.id);
</script>

<article class="card p-4">
	<CommentItem comment={thread}>
		{#snippet actions()}
			<button
				type="button"
				class="mt-2 cursor-pointer text-xs font-bold text-muted hover:text-ink"
				onclick={() => (replying = !replying)}
			>
				💬 Reply
			</button>
		{/snippet}
	</CommentItem>

	{#if replying}
		<div class="mt-3 ml-11">
			<CommentForm {siteKey} {form} parentId={thread.id} onposted={() => (replying = false)} />
		</div>
	{/if}

	{#if thread.replies.length}
		<div class="mt-4 ml-4 flex flex-col gap-4 border-l-2 border-line pl-4">
			{#each thread.replies as reply (reply.id)}
				<CommentItem comment={reply} />
			{/each}
		</div>
	{/if}
</article>
