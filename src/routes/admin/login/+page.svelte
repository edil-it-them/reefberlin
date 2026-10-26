<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Admin login</title></svelte:head>

<form method="POST" use:enhance class="card mx-auto mt-16 flex max-w-sm flex-col gap-3 p-6">
	<h1 class="text-lg font-bold">Admin login</h1>
	<input
		type="password"
		name="password"
		required
		autocomplete="current-password"
		aria-label="Password"
		placeholder="Password"
		class="field"
	/>
	{#if form?.error}<p role="alert" class="text-sm text-red-400">{form.error}</p>{/if}
	<button class="btn-primary">Log in</button>
</form>
