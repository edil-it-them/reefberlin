<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	// Initial values only: the sliders then own the state until saved.
	// svelte-ignore state_referenced_locally
	let x = $state(data.site.bannerX);
	// svelte-ignore state_referenced_locally
	let y = $state(data.site.bannerY);
	let picked = $state<string | null>(null);
	const preview = $derived(picked ?? data.site.bannerUrl);

	function onPick(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (picked) URL.revokeObjectURL(picked);
		picked = file ? URL.createObjectURL(file) : null;
	}
	const rules = $derived(
		Array.from({ length: data.maxRules }, (_, i) => data.site.rules[i] ?? { title: '', body: '' })
	);
</script>

<svelte:head><title>Admin · Site text</title></svelte:head>

<h1 class="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Site text</h1>
<p class="mb-4 text-sm text-muted">
	Everything on the community header, About panel and rules card. The pinned post is edited under Events (tick “Pin to
	top”). Leave a field empty to hide it.
</p>

<form method="POST" action="?/save" enctype="multipart/form-data" use:enhance={() => async ({ update }) => update({ reset: false })} class="flex max-w-2xl flex-col gap-3">
	<div class="flex flex-col gap-2">
		<label for="banner" class="text-sm font-medium">Banner image (optional)</label>
		<input id="banner" name="banner" type="file" accept="image/png,image/jpeg" aria-describedby="banner-help" class="field" onchange={onPick} />
		<p id="banner-help" class="text-xs text-muted">
			PNG or JPEG, up to 4 MB. It is optimized automatically and shown as a wide strip (about 8:1), so use the sliders to
			choose which part stays visible. Without an image, a gradient is shown.
		</p>
		{#if preview}
			<img
				src={preview}
				alt="Banner preview"
				class="aspect-8/1 w-full rounded-lg object-cover"
				style:object-position="{x}% {y}%"
			/>
			<label class="flex items-center gap-3 text-sm">
				<span class="w-24">Horizontal</span>
				<input type="range" min="0" max="100" bind:value={x} class="flex-1" />
				<span class="w-10 text-right text-muted">{x}%</span>
			</label>
			<label class="flex items-center gap-3 text-sm">
				<span class="w-24">Vertical</span>
				<input type="range" min="0" max="100" bind:value={y} class="flex-1" />
				<span class="w-10 text-right text-muted">{y}%</span>
			</label>
			<p class="text-xs text-muted">The preview is the desktop strip. On phones the strip is shorter, so more is cropped.</p>
		{/if}
		<input type="hidden" name="bannerX" value={x} />
		<input type="hidden" name="bannerY" value={y} />
		{#if data.site.bannerUrl}
			<label class="flex items-center gap-2 text-sm text-muted">
				<input name="removeBanner" type="checkbox" value="true" />
				Remove current banner (unless uploading a replacement)
			</label>
		{/if}
	</div>

	<h2 class="mt-3 text-sm font-bold uppercase tracking-wide text-muted">About REEF</h2>
	<label class="flex flex-col gap-1 text-sm font-medium">
		Tagline (one line)
		<input name="tagline" value={data.site.tagline} maxlength="120" class="field" />
	</label>
	<label class="flex flex-col gap-1 text-sm font-medium">
		Description (what REEF is, where it happens, who plays)
		<textarea name="description" rows="5" maxlength="800" class="field">{data.site.description}</textarea>
	</label>
	<div class="grid grid-cols-2 gap-2">
		<label class="flex flex-col gap-1 text-sm font-medium">
			Since (year)
			<input name="since" value={data.site.since} maxlength="4" inputmode="numeric" class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium">
			Home venue
			<input name="venue" value={data.site.venue} maxlength="80" class="field" />
		</label>
	</div>
	<label class="flex flex-col gap-1 text-sm font-medium">
		Resident Advisor link
		<input name="raUrl" value={data.site.raUrl} placeholder="https://ra.co/…" class="field" />
	</label>
	<label class="flex flex-col gap-1 text-sm font-medium">
		Instagram link
		<input name="instagramUrl" value={data.site.instagramUrl} placeholder="https://instagram.com/…" class="field" />
	</label>
	<label class="flex flex-col gap-1 text-sm font-medium">
		How to post (optional short line)
		<input name="howToPost" value={data.site.howToPost} maxlength="300" class="field" />
	</label>

	<h2 class="mt-3 text-sm font-bold uppercase tracking-wide text-muted">Rules (empty title = rule removed)</h2>
	{#each rules as rule, i (i)}
		<div class="card flex flex-col gap-2 p-3">
			<input name="rule-title-{i}" value={rule.title} maxlength="60" placeholder="Rule {i + 1} title" aria-label="Rule {i + 1} title" class="field" />
			<input name="rule-body-{i}" value={rule.body} maxlength="300" placeholder="One-line explanation" aria-label="Rule {i + 1} explanation" class="field" />
		</div>
	{/each}

	{#if form?.error}<p role="alert" class="text-sm text-red-400">{form.error}</p>{/if}
	{#if form?.success}<p role="status" class="text-sm text-green-400">Saved.</p>{/if}
	<div class="flex gap-2">
		<button class="btn-primary">Save</button>
	</div>
</form>

<form
	method="POST"
	action="?/reset"
	use:enhance={({ cancel }) => {
		if (!confirm('Replace all site text with the placeholder copy?')) cancel();
	}}
	class="mt-6"
>
	<button class="btn-danger">Reset to placeholder copy</button>
</form>
