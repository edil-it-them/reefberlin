<script lang="ts">
	import type { CommentView } from '#lib/server/comments.ts';
	import { timeAgo } from '#lib/shared.ts';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	type Props = {
		comment: CommentView;
		/** Extra action buttons (e.g. Reply) rendered after Share. */
		actions?: Snippet;
		/** Nested content such as a reply form or child comments. */
		children?: Snippet;
	};
	let { comment, actions, children }: Props = $props();

	let collapsed = $state(false);
	let copied = $state(false);

	async function share() {
		const url = `${page.url.origin}${page.url.pathname}#comment-${comment.id}`;
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// clipboard unavailable
		}
	}
</script>

<div id="comment-{comment.id}" class="flex gap-2">
	<div class="flex w-8 shrink-0 flex-col items-center">
		<span
			class="flex size-8 items-center justify-center rounded-full bg-card-hover text-lg"
			aria-hidden="true">{comment.icon}</span
		>
		{#if !collapsed}
			<button
				type="button"
				class="group mt-1 w-4 flex-1 cursor-pointer"
				aria-label="Collapse comment"
				onclick={() => (collapsed = true)}
			>
				<span class="mx-auto block h-full w-0.5 bg-line group-hover:bg-ink/60"></span>
			</button>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<p class="flex flex-wrap items-center gap-x-1 text-xs text-muted">
			<span class="font-bold text-ink">{comment.author}</span>
			<span>•</span>
			<time datetime={comment.createdAt.toISOString()}>{timeAgo(comment.createdAt)}</time>
			{#if comment.editedAt}<span>•</span><span title="Edited by a moderator">edited</span>{/if}
			{#if collapsed}
				<button
					type="button"
					class="ml-1 cursor-pointer font-bold text-link hover:underline"
					onclick={() => (collapsed = false)}>[+] expand</button
				>
			{/if}
		</p>

		{#if !collapsed}
			<p class="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">{comment.body}</p>
			<div class="mt-1 -ml-2 flex items-center gap-1">
				{@render actions?.()}
				<button type="button" class="action" onclick={share}>
					<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12.5V2.5M6.5 5.8 10 2.3l3.5 3.5M4 10v6.2h12V10" /></svg>
					{copied ? 'Link copied' : 'Share'}
				</button>
			</div>
			{@render children?.()}
		{/if}
	</div>
</div>
