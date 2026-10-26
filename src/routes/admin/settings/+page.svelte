<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Admin · Settings</title></svelte:head>

<h1 class="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Change password</h1>
<form method="POST" action="?/password" use:enhance class="card flex max-w-sm flex-col gap-3 p-4">
	<input type="password" name="current" required autocomplete="current-password" placeholder="Current password" aria-label="Current password" class="field" />
	<input type="password" name="next" required minlength="10" autocomplete="new-password" placeholder="New password" aria-label="New password" class="field" />
	<input type="password" name="confirm" required autocomplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" class="field" />
	{#if form?.error}<p role="alert" class="text-sm text-red-400">{form.error}</p>{/if}
	{#if form?.success}<p role="status" class="text-sm text-green-400">Password updated.</p>{/if}
	<div><button class="btn-primary">Update password</button></div>
</form>
