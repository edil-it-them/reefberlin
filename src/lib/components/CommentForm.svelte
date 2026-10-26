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
	};
	let { siteKey, parentId = null, form = null, onposted }: Props = $props();

	const mine = $derived(form && (form.parentId ?? null) === parentId ? form : null);
	let submitting = $state(false);
	let captcha: ReturnType<typeof Turnstile> | undefined = $state();
	const uid = $props.id();
</script>

<form
	method="POST"
	action="?/comment"
	class="flex flex-col gap-3"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			await update({ reset: result.type === 'success' });
			submitting = false;
			captcha?.reset();
			if (result.type === 'success') onposted?.();
		};
	}}
>
	{#if parentId !== null}<input type="hidden" name="parentId" value={parentId} />{/if}

	<textarea
		name="body"
		rows="3"
		required
		maxlength={LIMITS.comment.max}
		placeholder={parentId === null ? 'What are your thoughts?' : 'Write a reply'}
		aria-label="Comment"
		class="field"
		value={mine?.values?.body ?? ''}
	></textarea>

	<div class="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
		<select name="icon" aria-label="Icon" class="field w-auto" value={mine?.values?.icon ?? ICONS[0]}>
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
			class="field"
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
			class="field"
		/>
	</div>
	<p id="{uid}-hint" class="text-xs text-muted">
		First time? Your nickname and codeword claim that name. Use the same pair next time to post as
		the same person.
	</p>

	<Turnstile bind:this={captcha} {siteKey} />

	{#if mine?.error}<p role="alert" class="text-sm text-red-400">{mine.error}</p>{/if}

	<div>
		<button class="btn-primary" disabled={submitting}>{parentId === null ? 'Comment' : 'Reply'}</button>
	</div>
</form>
