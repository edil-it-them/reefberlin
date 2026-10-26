<script lang="ts">
	import { enhance } from '$app/forms';
	import Turnstile from '#lib/components/Turnstile.svelte';
	import { ICONS, LIMITS } from '#lib/shared.ts';

	type Props = {
		siteKey: string;
		parentId?: number | null;
		/** Result of the page's `comment` action, used to show errors on the matching form. */
		form?: { error?: string; parentId?: number | null; values?: Record<string, string> } | null;
		onposted?: () => void;
		oncancel?: () => void;
	};
	let { siteKey, parentId = null, form = null, onposted, oncancel }: Props = $props();

	const mine = $derived(form && (form.parentId ?? null) === parentId ? form : null);
	let submitting = $state(false);
	let captcha: ReturnType<typeof Turnstile> | undefined = $state();
	const uid = $props.id();
	// Top-level form starts as a collapsed pill; replies are always expanded.
	// svelte-ignore state_referenced_locally
	let expanded = $state(parentId !== null || !!mine);

	function cancel() {
		expanded = parentId !== null;
		oncancel?.();
	}
</script>

{#if !expanded}
	<button
		type="button"
		class="flex h-10 w-full cursor-text items-center rounded-full border border-line px-4 text-left text-sm text-muted hover:border-ink/40 hover:bg-card-hover"
		onclick={() => (expanded = true)}
	>
		Add a comment
	</button>
{:else}
	<form
		method="POST"
		action="?/comment"
		class="overflow-hidden rounded-2xl border border-line focus-within:border-ink/60"
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				await update({ reset: result.type === 'success' });
				submitting = false;
				captcha?.reset();
				if (result.type === 'success') {
					expanded = parentId !== null;
					onposted?.();
				}
			};
		}}
	>
		{#if parentId !== null}<input type="hidden" name="parentId" value={parentId} />{/if}

		<!-- svelte-ignore a11y_autofocus -->
		<textarea
			name="body"
			rows="3"
			required
			autofocus
			maxlength={LIMITS.comment.max}
			placeholder={parentId === null ? 'Add a comment' : 'Write a reply'}
			aria-label="Comment"
			class="block w-full resize-y bg-transparent px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none"
			value={mine?.values?.body ?? ''}
		></textarea>

		<div class="flex flex-wrap items-center gap-2 border-t border-line/60 px-3 py-2">
			<select
				name="icon"
				aria-label="Icon"
				class="h-8 rounded-full bg-field px-2 text-sm"
				value={mine?.values?.icon ?? ICONS[0]}
			>
				{#each ICONS as icon (icon)}<option value={icon}>{icon}</option>{/each}
			</select>
			<input
				name="nickname"
				required
				minlength={LIMITS.nickname.min}
				maxlength={LIMITS.nickname.max}
				placeholder="Nickname"
				autocomplete="nickname"
				aria-label="Nickname"
				class="h-8 min-w-0 flex-1 rounded-full bg-field px-3 text-sm placeholder:text-muted focus:outline-none"
				value={mine?.values?.nickname ?? ''}
			/>
			<input
				name="codeword"
				type="password"
				required
				minlength={LIMITS.codeword.min}
				maxlength={LIMITS.codeword.max}
				placeholder="Codeword"
				autocomplete="off"
				aria-label="Codeword"
				class="h-8 min-w-0 flex-1 rounded-full bg-field px-3 text-sm placeholder:text-muted focus:outline-none"
			/>
		</div>
		<p id="{uid}-hint" class="px-4 pb-2 text-xs text-muted">
			First time? Your nickname and codeword claim that name. Use the same pair next time to post
			as the same person.
		</p>

		<div class="px-3">
			<Turnstile bind:this={captcha} {siteKey} />
		</div>

		{#if mine?.error}<p role="alert" class="px-4 pb-2 text-sm text-red-400">{mine.error}</p>{/if}

		<div class="flex justify-end gap-2 bg-card-hover/60 px-3 py-2">
			<button type="button" class="btn bg-line text-ink hover:bg-muted/40" onclick={cancel}>
				Cancel
			</button>
			<button class="btn bg-accent text-white hover:bg-[#0053ce]" disabled={submitting}>
				{parentId === null ? 'Comment' : 'Reply'}
			</button>
		</div>
	</form>
{/if}
