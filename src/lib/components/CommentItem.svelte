<script lang="ts">
	import type { CommentView } from '#lib/server/comments.ts';
	import { timeAgo } from '#lib/shared.ts';
	import type { Snippet } from 'svelte';

	let { comment, actions }: { comment: CommentView; actions?: Snippet } = $props();
</script>

<div class="flex gap-3">
	<span
		class="flex size-8 shrink-0 items-center justify-center rounded-full bg-card-hover text-lg"
		aria-hidden="true">{comment.icon}</span
	>
	<div class="min-w-0 flex-1">
		<p class="text-xs text-muted">
			<span class="font-bold text-ink">{comment.author}</span> ·
			<time datetime={comment.createdAt.toISOString()}>{timeAgo(comment.createdAt)}</time>
			{#if comment.editedAt}· <span title="Edited by a moderator">edited</span>{/if}
		</p>
		<p class="mt-1 text-sm break-words whitespace-pre-wrap">{comment.body}</p>
		{@render actions?.()}
	</div>
</div>
